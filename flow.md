# Mesh — Engineering Deep Dive & Interview Defense Guide

**Codebase analyzed:** `mesh-turborepo-main` (Turborepo monorepo: `apps/mesh-app` — Next.js 16 / Convex full-stack app, `apps/mesh-wss` — standalone presence WebSocket server)

This document explains **why** Mesh is built the way it is, not just what the code does. Every claim is grounded in the actual files in the repo. Where something is inferred rather than directly stated in code/comments, it is labeled **[Inference]**. Where the request asks about something not present in the project, it is labeled **Not implemented in the current project.**

---

## 1. Project Overview

Mesh is a Discord-style real-time communication platform: servers (guilds) with categorized text/voice channels, role-based permissions, threaded conversations, DM/friend system, emoji reactions, presence (online/idle/dnd/offline), and voice/video calls.

**Why build this project?** It touches nearly every hard problem in full-stack engineering at once: relational-ish data modeling with many-to-many relationships (servers/members/roles), real-time data sync at multiple scopes (server-wide, channel, DM, thread), presence tracking across multiple devices/tabs, authorization (RBAC), file upload, and live audio/video — making it a strong single project to demonstrate breadth.

**Where the "backend" actually lives:** There is no traditional Express/Nest REST API server for the core domain logic. The backend is **Convex** — a hosted reactive database + serverless function platform. Domain logic lives in `apps/mesh-app/convex/*.ts` as `query`/`mutation` functions, which double as both the API layer and the transaction layer against the database. Three narrow pieces of logic that don't fit Convex's function model live in Next.js Route Handlers (`apps/mesh-app/src/app/api/*/route.ts`): minting Liveblocks session tokens, minting LiveKit voice tokens, and receiving presence callbacks from the WebSocket server.

**The monorepo:** `apps/mesh-app` (product) and `apps/mesh-wss` (a single-purpose Node WebSocket microservice for presence) are managed with Turborepo (`turbo.json`), so `npm run dev` boots both concurrently and `build`/`check-types` are cached and parallelized across packages as the repo grows.

---

## 2. Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│         mesh-app             │        │          mesh-wss             │
│  Next.js 16 App Router        │        │  Node + ws (standalone)        │
│                               │        │  Presence only                 │
│  - React 19 UI                │◄──────►│  - one process, in-memory map  │
│  - Convex React client         │  WS    │  - heartbeat/ping-pong          │
│  - Liveblocks React client      │       │  - calls back into mesh-app    │
│  - LiveKit React components      │      │    via HTTP POST /api/mark-status│
│  - Route Handlers (3 thin ones)   │      └──────────────────────────────┘
└──────────────┬────────────────┘
               │ Convex client (queries/mutations, WebSocket-based reactivity)
               ▼
      ┌─────────────────────┐        ┌────────────────────┐       ┌───────────────┐
      │       Convex          │        │     Liveblocks       │       │    LiveKit      │
      │  (source of truth)     │        │  (ephemeral presence,  │       │ (voice/video SFU)│
      │  - schema.ts (tables)   │        │   typing indicators,    │       │  - token minted   │
      │  - auth.ts (users)       │        │   per-room sessions)     │       │   by /api/livekit │
      │  - messages/servers/      │        └────────────────────┘       └───────────────┘
      │    channels/roles/…         │
      │  - file storage (images)     │
      └─────────────────────────┘
```

Mesh deliberately uses **three different real-time systems for three different jobs** instead of building one and forcing everything through it. That's the single most important architectural decision in the project, and it recurs throughout this document:

| System | Used for | Why not something else |
|---|---|---|
| **Convex** | All persisted state: messages, servers, channels, roles, reactions, friend graph, files | Needs durability, transactions, query consistency, pagination |
| **Liveblocks** | Typing indicators, per-room ephemeral presence metadata | Needs sub-100ms fan-out with zero persistence cost; wrong to write "X is typing" to a database |
| **mesh-wss + Convex** | Online/offline/idle/dnd status across tabs/devices | Needs a durable TCP connection to *detect disconnects* — something a request/response database client can't do by itself |
| **LiveKit** | Voice/video media | WebRTC SFU media routing is a completely different problem (audio/video packets) from data sync; Convex/Liveblocks are not media servers |

**Alternative considered:** a single custom WebSocket gateway in front of everything (a "monolithic realtime service"). **Why Mesh didn't do this:** Convex already provides reactive queries over WebSockets for free (any query subscribed to on the client automatically re-runs when the underlying data changes), so building a second parallel real-time layer for persisted data would be pure duplication. The extra systems (Liveblocks, mesh-wss) were introduced only for the specific things Convex reactivity does *not* solve well: (a) high-frequency ephemeral state that shouldn't hit a database at all, and (b) meaningful TCP-level disconnect detection for presence.

**Trade-off:** this is now three vendor/infra dependencies instead of one, three different auth models to keep in sync (Convex auth session → Liveblocks token → LiveKit token), and three different failure domains to reason about. The alternative (cramming typing indicators and presence into Convex mutations) would have been simpler to operate but would have added write load and latency to the DB for data that has no long-term value.

---

## 3. Complete Request / Data Flow

### 3.1 A query (e.g., loading channel messages)
```
Component (MessageList) 
  → hook useGetMessages (usePaginatedQuery(api.messages.getMessages, …))
  → Convex client opens/reuses a WebSocket to the Convex deployment
  → Convex re-runs messages.getMessages handler whenever any document it read changes
  → handler: auth check (getAuthUserId) → indexed query on "messages" 
      → for each message: populateMember, populateUser, populateReactions, populateThread (N+1 fan-out, see §12)
  → result streamed back over the same WebSocket → React re-renders reactively, no client-side cache invalidation code needed
```

### 3.2 A mutation (e.g., sending a message)
```
ChatInput.handleSubmit
  → (if image) useGenerateUploadUrl → convex.storage.generateUploadUrl() 
      → browser POSTs raw file bytes directly to the returned Convex storage URL → gets storageId
  → useCreateMessage → convex mutation messages.createMessage({ body, image: storageId, serverId, channelId, … })
  → handler: getAuthUserId → checkMember (is caller actually in this server?) 
      → checkPermission(SEND_MESSAGES) && !member.isMuted
      → ctx.db.insert("messages", …)
  → Convex detects the "messages" table changed → pushes new results to every subscribed client (every open MessageList for that channel) over their existing WebSocket
  → no explicit "broadcast" or "emit" code was written by the developer — this is the payoff of choosing Convex
```

### 3.3 A presence transition (tab open/close)
```
Browser tab opens → PresenceTracker (mounted once in app/layout.tsx via PresenceTrackerWrapper)
  → new WebSocket(`wss://mesh-turborepo.onrender.com?userId=<id>`) to apps/mesh-wss
  → mesh-wss increments concurrentConnectionsMap[userId]; if it went 0→1, POSTs {userId, status:"online"} 
      to mesh-app's /api/mark-status route
  → /api/mark-status calls Convex mutation users.updateEffectiveStatus(userId, "online")
  → any UI subscribed to that user's presence (via Convex query) re-renders reactively
Tab closes / network drops → ws "close" event on mesh-wss → decrements the counter 
  → if it hits 0, POSTs status:"offline" → same path back into Convex
```

### 3.4 A typing indicator (no database involved at all)
```
Editor.tsx onChange → updateMyPresence({ isTyping: true }) (Liveblocks React hook)
  → Liveblocks relays this presence patch to every other client in the same "room" (channel/DM/thread id)
  → useOthers() on peers' Editor.tsx re-renders "X is typing…" 
  → nothing is written to Convex; this state is discarded the moment the tab/room is left
```

### 3.5 A voice call
```
User clicks "Join Voice" → sets zustand useVoiceRoomProps (channelId/friendId/type/audio/video)
  → VoiceRoom.tsx effect fires → GET /api/livekit?room=<deterministic room name>&useremail=<email>
  → route mints a LiveKit AccessToken (server-side secret, never shipped to client) scoped to that room
  → <LiveKitRoom token=…> connects over WebRTC to the LiveKit SFU — media never touches Convex or Next.js servers again
```

---

## 4. Feature-by-Feature Analysis

### 4.1 Auth (`convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`)
**What:** Uses `@convex-dev/auth` with Password, GitHub, and Google providers. `auth.config.ts` registers Convex itself as the JWT audience/issuer domain. `http.ts` mounts the auth provider's OAuth callback routes onto Convex's HTTP router.
**Why this library:** Convex Auth is purpose-built to hand session JWTs that Convex's own `getAuthUserId(ctx)` can verify *inside* a query/mutation, without the app needing a separate session store, cookie-parsing middleware, or a second database for sessions. Given the whole backend is already Convex, adding a separate auth provider (e.g., NextAuth backed by Postgres, or Clerk) would mean verifying a foreign JWT format inside every Convex function and keeping a second user table in sync — pure duplicated complexity.
**Alternative:** NextAuth.js with its own adapter/DB, or Clerk/Auth0 as a hosted IdP. **Why not chosen:** both require Convex functions to independently verify a third-party-issued token on every call (extra latency + another secret to manage) and to maintain a mirrored `users` table via webhooks. Convex Auth's users table *is* the `users` table already in `schema.ts` (via `authTables` spread into `defineSchema`).
**Trade-off:** vendor lock-in to Convex's auth implementation, less mature/ecosystem-proven than NextAuth/Clerk, but zero cross-system session-sync bugs.
**Interesting detail:** `afterUserCreatedOrUpdated` callback patches the freshly created user with `effectiveStatus/manualStatus: "online"` — this is where "new account defaults to online" is enforced, and it's done as a *side effect of auth*, not as a separate onboarding step, so there's no window where a user exists without a presence status.

### 4.2 Servers, Channels, Categories (`convex/servers.ts`, `convex/channels.ts`)
**What/Where:** `createServer` (servers.ts) does four inserts in sequence (server → `@everyone` role → "Text Channels"/"Voice Channels" category channels → two default channels → the creator's own `serverMembers` row) so that a newly created server is immediately usable — mirroring Discord's onboarding UX.
**Why a join code instead of invite links/tables:** `generateCode()` produces a random 6-char base36 string stored directly on the `servers` row (`joinCode`). `joinServer` mutation compares the submitted code case-insensitively. This is the simplest possible invite mechanism — one column, one string comparison — versus a full `invites` table with expiry/usage-limit tracking.
**Alternative:** a dedicated `invites` table (code → serverId, expiresAt, maxUses, uses). **Why not (yet):** the current requirement is "one reusable join code per server," which the single-column design satisfies; a multi-invite system is strictly more complex and wasn't needed for the feature as scoped. **Trade-off:** you cannot have *multiple* invite links with different expirations/permissions per server today — every member who ever learns the join code can join forever until `generateNewJoinCode` is called.
**Channels as a self-referential tree:** `channels` table has `parentId: v.optional(v.id("channels"))`, so "category" channels are just channels with `type: "category"` and no parent, and text/voice channels point at a category via `parentId`. **Why this shape over a separate `categories` table:** categories and channels share the same query/permission/ordering semantics, so modeling them as one recursive table avoids duplicating almost the same schema and functions twice. **Trade-off:** the schema loses the type-safety that a separate `categories` table would give (e.g., nothing stops a category itself from having a `parentId` pointing at another category, causing awkward nesting) — this is enforced by convention (the mutation always sets `type` from the caller), not by the schema.

### 4.3 Roles & Permissions (`convex/roles.ts`, `src/lib/permissions.ts`, `schema.ts`)
**What:** `SERVER_PERMISSIONS` is a fixed, closed set of string literals (`MANAGE_SERVER`, `SEND_MESSAGES`, `ADMINISTRATOR`, …) defined once in `schema.ts` and reused everywhere via `serverPermissionValidator = v.union(...literals)`. `roles` rows hold `permissions: string[]` and belong to a server. `serverMembers.roleIds` is an array of role ids — i.e., many-to-many between members and roles, implemented as an array column rather than a join table.
**Why an array column instead of a `memberRoles` join table:** Convex isn't a relational SQL database with join optimization; a member's role list is read constantly (every permission check) and written rarely (role assignment), so storing `roleIds` directly on `serverMembers` avoids an extra indexed lookup on the hot path (`checkPermission` → `ctx.db.get(roleId)` for each id directly, no query needed).
**Alternative:** a `memberRoles(memberId, roleId)` table with indexes on both columns (the traditional relational answer to many-to-many). **Trade-off of the current approach:** adding/removing a role is a full-array patch (`roleIds: [...member.roleIds, roleId]`) which is fine at small role counts per member but means "does member X have role Y" is an array scan rather than an indexed point lookup — irrelevant at Discord-server scale (a handful of roles per member) but would degrade if a member could hold hundreds of roles.
**How permission checks actually work (`src/lib/permissions.ts` → `checkPermission`):** load the member → load their server → **owner always passes** (`server.ownerId === userId` short-circuits to `true`, so the server owner can never be locked out even with no roles) → otherwise resolve all of the member's roles and flatten their permissions → check for `"ADMINISTRATOR"` (blanket bypass) or the specific requested permission. This mirrors Discord's real permission model (owner override + admin bypass + role union) closely.
**Why compute this per-request instead of caching a resolved permission set on the member row:** correctness — role permissions can change (`modifyRole`) at any time, and if permissions were cached on the member they'd go stale the instant an admin edits a role, silently under- or over-authorizing actions. Recomputing on every check trades a few extra `ctx.db.get` calls for permissions that are *always* correct, which matters far more for an authorization system than shaving milliseconds.
**Everyone role protection:** `removRoleFromMember`, `removeRole` explicitly look up the `@everyone` role and refuse to let it be removed/deleted — enforced in application code (`EVERYONE_ROLE` constant), not a DB constraint, because Convex doesn't support arbitrary CHECK constraints. **Current implementation → Problem → Better implementation:** this invariant is duplicated across two functions (`removeRole` and `removRoleFromMember`) with slightly different guard phrasing; a single `assertNotEveryoneRole(role)` helper would remove the duplication risk (someone edits one copy and forgets the other). **Trade-off of fixing it:** a marginal readability win for a few more lines of indirection — worth doing, low risk.

### 4.4 Messages, Threads, Reactions (`convex/messages.ts`, `convex/reactions.ts`)
**What:** `messages` rows can belong to a channel *or* a DM (`conversationId`) *or* be a thread reply (`parentMessageId`) — one table, three optional foreign keys, because in Discord's model a "message" is conceptually the same entity in all three contexts (it can be edited, deleted, reacted to, threaded from, identically).
**Why one polymorphic table over three separate tables (`channelMessages`, `dmMessages`, `threadReplies`):** reactions, editing, deletion, and thread-counting logic (`populateThread`, `populateReactions`) would otherwise need to be implemented and kept in sync three times. A single table with optional discriminator columns keeps that logic in one place. **Trade-off:** most columns are `optional`, so the schema doesn't statically guarantee "a message has exactly one of channelId/conversationId" — that invariant is enforced only by mutation logic (`createMessage` picks whichever id was passed, or derives `conversationId` from the parent when only `parentMessageId` is given), not by the schema itself. A bug in a mutation could in principle insert a message with neither or both set.
**The compound index `byChannelIdAndParentMessageIdAndConversationId`:** this is the single most important index in the schema. `getMessages` always queries through it with `.eq("channelId", channelId).eq("parentMessageId", parentMessageId).eq("conversationId", _conversationId)`, where the two "not relevant to this fetch" ids are `undefined`. **Why this composite index instead of three separate single-field indexes:** Convex indexes are evaluated left-to-right as an exact-match prefix, so a 3-field composite index lets one index serve top-level channel messages, DM messages, and thread replies with a single query shape, instead of Convex having to pick between three separate indexes (or scan). **Why not query `messages.byChannelId` and then filter in memory for `parentMessageId == null`?** that would fetch every message in a channel (including all of its thread replies) just to discard most of them — wasteful and non-paginating correctly (Convex's `.paginate()` needs to operate on the already-filtered result set, not filter after the page is fetched).
**Cursor-based pagination (`paginationOptsValidator`, `.paginate(paginationOpts)`):**
- **My approach:** Convex's built-in cursor pagination, ordered `desc` (most recent messages first), consumed client-side via `usePaginatedQuery` (`useGetMessages.ts`), with `BATCH_SIZE = 20`.
- **Alternatives:** offset/limit pagination (`OFFSET n LIMIT 20`), or page-number pagination.
- **Why cursor over offset:** messages are inserted continuously into the same table while a user scrolls back through history. Offset pagination re-numbers every row on every insert, so "page 2" can silently skip or repeat messages if new ones arrive between page loads (classic feed-pagination bug). A cursor anchored to a specific document position is stable regardless of concurrent inserts elsewhere in the table.
- **Trade-off:** you lose "jump to page N" / total-count-based UI (e.g., "page 4 of 20") — not needed here since chat UIs are infinite-scroll, not paged tables.
- **Performance:** cursor pagination on an index is O(page size) per fetch regardless of how deep into history you scroll; offset pagination degrades toward O(offset) as `OFFSET` grows, which matters a lot for old, long-lived channels.

**Reactions (`toggleReaction`, dedup index `byMemberIdAndbyMessageIdAndbyValue`):** toggling is implemented as "look up this exact (member, message, emoji) reaction; if it exists, delete it (un-react); else insert it" — a single round trip, no separate "hasReacted" check followed by a separate write, which would be a race condition between concurrent toggles from the same user (see §6). The compound index makes that lookup O(1) instead of scanning all reactions on a message and filtering in JS.
**Reaction de-duplication for display (`ReactionMap`/`DedupedReaction` in `messages.ts`):** raw `reactions` rows (one per user per emoji) are grouped in-memory into `{ value, count, memberIds[] }` before being sent to the client, so the UI can render "👍 3" instead of three separate rows. **Why not store aggregated counts directly on the message (e.g., `message.reactionCounts: {emoji: count}`)?** that would require a transactional increment/decrement on every toggle and would still need the *list of members* who reacted (for the "who reacted" hover tooltip) — so the per-reaction rows are unavoidable, and grouping happens at read time as effectively free CPU work on results the app already fetched.

### 4.5 Friend System (`convex/friendRequests.ts`, `convex/friendConversation.ts`, `convex/friendMessages.ts`, `convex/friendReactions.ts`)
**What:** an entirely parallel data model to servers/channels for 1:1 relationships outside of any server: `friendRequests` (with `pending/accepted/rejected/blocked` states), `friendConversations`, `friendMessages`, `friendReactions`.
**Why a parallel model instead of reusing `serverConversations`/`messages`/`reactions`:** a friend DM is not scoped to any server — there's no `serverId` and no `serverMembers` row to hang a message off of (a `messages.serverMemberId` is required in the schema), so the server-scoped tables literally cannot represent a friendship-based DM. **Trade-off — flagged as a real weakness:** this duplicates almost the entire messaging feature (create/edit/delete/paginate/populate-thread/populate-reactions) as a second implementation (`friendMessages.ts` mirrors `messages.ts` line-for-line in most of its logic, `friendReactions.ts` mirrors `reactions.ts`). **Current implementation → Problem → Better implementation:** a unified `messages` schema with a nullable `serverId`/`serverMemberId` *and* a nullable `userId` (falling back to "author is a bare user, not a server member" when there's no server context) would collapse both code paths into one, at the cost of messier optional-field logic and permission checks that now have to branch on "is this a server message or a DM message" internally instead of by function name. Given the size of this codebase, the current duplication is a reasonable, honest trade — but it is the clearest "what would you refactor" answer in the whole project.
**Canonical ordering to prevent duplicate conversations (`createOrGetFriendConversation`, `createOrGetConversation`):** both sort the two participant ids (`currentUser._id < otherUser._id ? […] : […]`) before querying/inserting, so `(A,B)` and `(B,A)` always resolve to the same conversation row and index lookup, using an index over `(user1Id, user2Id)`. **Why not just query with an `$or`:** Convex indexes don't support OR across two orderings efficiently; canonicalizing the pair at write time turns a potential two-directional lookup into a single deterministic indexed point lookup.
**Blocking model:** `blockFriendRequest` patches status to `"blocked"` rather than deleting the row, so a block is remembered and can be queried/reversed (`unblockFriendRequest`) — deleting on block would lose the fact that a block ever happened and would let the blocked user immediately re-send a request.

### 4.6 Presence (`apps/mesh-wss`, `/api/mark-status`, `convex/users.ts`)
Covered in depth in §10 (real-time architecture) since this is the project's standout systems-design piece.

### 4.7 Typing Indicators & Room Presence (Liveblocks) — §10 as well.

### 4.8 Voice/Video (LiveKit) — §10 as well.

### 4.9 File Upload (`convex/upload.ts`, `useGenerateUploadUrl`)
**What:** `generateUploadUrl` mutation returns a short-lived signed URL from Convex's built-in file storage; the client `fetch(url, { method: "POST", body: image })`s the raw file directly to Convex, then submits the returned `storageId` as the `image` field on `createMessage`/`createFriendMessage`.
**Why not upload through the Next.js server (proxy the bytes through an API route) or a general-purpose object store (S3/R2) with a separate SDK:** Convex file storage is already the same platform hosting the database, so `ctx.storage.getUrl(message.image)` at read time and `ctx.storage.generateUploadUrl()` at write time need zero additional credentials, buckets, or CORS configuration — it's the "no extra infrastructure" choice. Uploading directly from the browser to Convex (rather than through the Next.js server) also means large image payloads never consume the Node/Next server's request-handling capacity or memory.
**Trade-off:** no image resizing/transformation pipeline, no CDN in front of the stored image beyond whatever Convex's storage layer provides, and files are tied to Convex's pricing/limits rather than a cheaper dedicated blob store at very large scale.
**Security note:** the upload URL is single-use and generated per-request behind an authenticated mutation, so anonymous/unauthenticated clients cannot obtain one — but there's no server-side validation of file *type* or *size* before accepting the upload in the current code (`generateUploadUrl` takes no arguments and no MIME/size constraints). **Not implemented in the current project:** file-type allowlisting, size limits, or virus/content scanning on uploaded images.

---

## 5. Database Architecture Deep Dive

Convex is a **document database with declared, schema-validated tables** (via `defineTable`/`v.*` validators in `schema.ts`) and **manually declared secondary indexes** (`.index("name", [fields])`) — closer to a strongly-typed document store than either a free-form NoSQL store or a full relational engine with a query planner and joins.

**Why Convex over Postgres/MySQL (SQL) or a bare NoSQL store (Mongo/Dynamo):**
- Reactive queries (subscriptions that automatically re-run and push new data to every client when underlying rows change) are the core value proposition — this is what powers "message appears instantly for everyone in the channel" and "presence updates live" *without hand-rolling WebSocket broadcast code, pub/sub topics, or cache invalidation.* A raw SQL/NoSQL database gives you none of that; you'd have to build a message bus (Kafka/Redis pub-sub) and a WebSocket gateway on top of it yourself — which is close to reinventing `mesh-wss` and Liveblocks, but for *every* feature, not just presence.
- Colocated backend functions (`query`/`mutation` handlers) run *in the same transaction* as the database access, so a mutation like `deleteServer` that fans out deletes across `serverMembers`, `roles`, `channels`, `messages`, `serverConversations` is one atomic unit of work with no separate "backend service calls DB, then calls DB again" round trips or partial-failure windows.
**Alternative considered:** Postgres + Prisma/Drizzle behind a REST/GraphQL API, with a separate Redis pub-sub + WebSocket layer for real-time. **Why not:** strictly more moving parts to get the same reactive behavior Convex provides out of the box, and joins in SQL *would* have been nicer for some of the fan-out queries in `messages.getMessages` (see §12) — that's the real cost being paid here.

### 5.1 Table-by-table rationale

**`users`** (merged with Convex's `authTables`): holds both auth identity fields (email, phone, verification times — from `authTables`) and app-specific presence fields (`effectiveStatus`, `manualStatus`, `lastSeen`). Indexed on `email` because `createFriendRequest` looks up a target user by email (`toUserEmail`) — the only place users are found by anything other than `_id`.
- **effectiveStatus vs manualStatus — why two status fields, not one:** `manualStatus` is what the user explicitly chose (e.g., they set themselves to "dnd"). `effectiveStatus` is what's actually shown, and can be forced to `"offline"` by the presence system regardless of manual status (see `updateEffectiveStatus`: `status: status === "offline" ? status : user.manualStatus || "online"`). This lets a user say "I want to appear DND" while still being correctly shown as offline the instant their last tab disconnects, and correctly restored to "dnd" (not just "online") the next time they connect. Collapsing these into one field would mean either losing the user's chosen status on every reconnect, or being unable to represent "actually offline" separately from "the last status the user picked."

**`friendRequests`**: a single row represents a request in *any* state (`pending/accepted/rejected/blocked`) rather than separate tables per state, with `userOne`/`userTwo` canonically sorted and `initiatedBy` tracking who actually sent it (needed to know which side sees "incoming" vs "outgoing" in `getFriendRequests`). Indexed on `byUserOne`, `byUserTwo` separately (since a user can appear on either side) and `byUserOneAndUserTwo` (the canonical-pair uniqueness check in `createFriendRequest`).
- **Race condition surface:** `createFriendRequest` reads `isFriendRequestExists` then inserts — between the read and the write, a second concurrent request from the same pair could both pass the check and insert two rows. Convex mutations are serializable per-document-set they touch, but this specific two-step read-then-insert-on-a-different-key pattern is not fully closed by a uniqueness constraint (Convex has no native unique index enforcement beyond `.unique()` throwing on *read* if two rows exist, not preventing the *write* of a duplicate). **This is a genuine, currently-unmitigated race window** — flagged explicitly per instructions rather than assumed to be safe.

**`servers` / `serverMembers` / `roles`**: classic three-table RBAC shape (tenant / membership / permission-set), except `serverMembers.roleIds` denormalizes the membership↔role many-to-many onto the membership row (§4.3). `uniqueMembership` index on `(userId, serverId)` is the load-bearing index of the entire authorization system — nearly every mutation in the codebase starts with a lookup through it to establish "is this caller even in this server."

**`channels`**: self-referential tree via `parentId` (§4.2), indexed by `serverId`, `parentId`, and the pair together (`byServerAndParentId`) to support "get all channels directly under category X in server Y" without a table scan.

**`serverConversations` / `friendConversations`**: thin junction rows (`member1Id + member2Id [+ serverId]`) whose only real job is to be a stable id that `messages.conversationId` can point at, plus `lastMessageAt` for potential "recent DMs" sorting. Canonical ordering as described in §4.5.

**`messages` / `friendMessages`**: covered in §4.4/§4.5.

**`reactions` / `friendReactions`**: one row per (actor, message, emoji) — the natural normalized form; anything less granular (e.g., `message.reactionCounts` map) would lose "who reacted" without a second lookup, and anything more granular isn't possible.

### 5.2 Expensive/risky queries
- `getMessages` and `getFriendMessages` do an **N+1 fan-out per page** (member, user, reactions, thread info per message — see §12) — 20 messages means roughly 20×4 sequential `ctx.db.get`/indexed-query calls per page load. At current scale this is fine (Convex batches/pipelines these efficiently and they're all indexed point-lookups, not scans), but it is the first thing that would need batching/denormalization if message volume per page or read QPS grew substantially.
- `getFriendRequests` fetches **all** of a user's friend requests across all statuses in one call (two `.collect()` queries, no pagination) — fine for a friend list of dozens to low hundreds, but would need pagination if a user could accumulate thousands of historical requests.
- `deleteServer` and `removeMember` fan out deletes across 3–5 tables with `Promise.all`/`Promise.allSettled` — correct for correctness (nothing is orphaned) but means deleting a very large, old server is proportional to its total message/member/reaction count, with no batching/background-job strategy (see §7, §13).

### 5.3 Transactions and consistency
Every Convex mutation handler is **automatically transactional** — all reads and writes inside one `mutation(...)` handler either all commit or all roll back, and Convex serializes conflicting mutations against the same documents. This is why `createServer`'s four sequential inserts, or `deleteServer`'s five-table fan-out delete, don't need any explicit `BEGIN/COMMIT` — that's a built-in property of the platform, not something the app code had to implement.
**Where transactions matter most in this codebase:** `joinServer` (check joinCode → check not-already-member → insert serverMembers) and `toggleReaction` (check-existing → delete-or-insert) both rely on this to avoid double-joins / duplicate-then-orphaned reactions under concurrent calls from the same user.

---

## 6. API / Backend Architecture

**Two backend surfaces, deliberately kept separate:**
1. **Convex functions** — all domain logic. `query` = read-only, cacheable, subscribable. `mutation` = read+write, transactional. This is >95% of the backend.
2. **Next.js Route Handlers** (`src/app/api/**/route.ts`) — used *only* for the three things Convex functions structurally cannot do: (a) mint third-party session tokens using server-only secrets (`LIVEBLOCKS_SECRET_KEY`, `LIVEKIT_API_SECRET`) that shouldn't be embedded in a Convex function reachable the same way client code calls it, and (b) receive an inbound webhook-style POST from an external process (`mesh-wss`) that isn't a Convex client at all.

**Why not proxy *everything* through Route Handlers (a "traditional REST API in front of Convex")?** That would throw away Convex's reactivity — a REST endpoint has no way to push updates to subscribed clients; you'd be back to polling or hand-building WebSocket fan-out. The project correctly uses Route Handlers only where they're the *only* option, and Convex functions everywhere reactivity is valuable (i.e., everywhere data is displayed live).

**Consistent authorization pattern across nearly every Convex function:**
```
getAuthUserId(ctx) → fail fast if not signed in
        → look up the relevant membership/ownership row (checkMember / uniqueMembership index)
        → checkPermission(...) for the specific permission required (mutations only)
        → perform the DB operation
```
This same 3–4 line shape appears in `channels.ts`, `roles.ts`, `servers.ts`, `messages.ts`, `serverMembers.ts` — a form of **defense in depth**: every single mutation independently re-verifies membership and permission rather than trusting a higher-level "you're allowed to be here" check done once by a router/middleware. **Why repeat this in every function instead of a shared middleware wrapper:** Convex doesn't have Express-style middleware chaining for functions (no `router.use(authMiddleware)`); the idiomatic pattern is small composable helper functions (`checkMember`, `checkPermission` in `src/lib/`) called explicitly at the top of each handler. **Trade-off:** more repeated lines per file, but each function's authorization logic is fully visible by reading that one function — nothing "happens elsewhere" implicitly, which is arguably *safer* for an interview defense ("show me exactly what stops user X from doing Y" has a one-function answer everywhere).

---

## 7. WebSocket / Real-Time Architecture

This is split into three genuinely different systems and each is analyzed on its own terms, per instructions.

### 7.1 Convex reactivity (the "primary" real-time layer)
Not literally raw WebSockets the app code manages — the Convex React client (`ConvexReactClient` in `ConvexClientProvider.tsx`) maintains one WebSocket connection to the Convex deployment per browser tab and multiplexes every active query subscription over it. When a mutation changes a document, Convex recomputes exactly the subscribed queries whose result could have changed and pushes new data over that socket. This is **why almost nothing in `mesh-app`'s UI code contains manual "refetch" or "invalidate cache" logic** — it's the single biggest reason the app is real-time by default.

### 7.2 Liveblocks (ephemeral presence + typing)
**Why WebSockets/Liveblocks here and not Convex mutations:** typing indicators fire on every keystroke. Writing that to Convex would mean a database write (and a reactive fan-out recomputation) per keystroke per user, across every open channel — real cost for zero durability value (nobody needs "was typing 4 minutes ago" to survive a refresh). Liveblocks' presence model is explicitly designed for this: `updateMyPresence({ isTyping })` (see `Editor.tsx`) patches an in-memory, per-connection presence object that Liveblocks relays to other clients in the same "room" and **never persists**.
**Room scoping is the interesting design decision:** each Liveblocks room id is deliberately constructed to be the *narrowest reasonable scope* for what it's presence-tracking:
- Self/global presence room = `String(userData._id)` (`Room.tsx`, via `/api/liveblock-friend-auth`)
- Channel typing = `String(channelData._id)` (`ChannelRoom.tsx` → `/api/liveblock-server-channel-auth`)
- Server-scoped DM typing = `serverId + sorted(id1,id2)` (`/api/liveblock-server-member-auth`)
- Thread typing = `"parentMessage" + parentMessageId` / `"friendThreadMessage" + parentMessageId`
- Friend DM typing = `"friendMessage" + sorted(u1,u2)`

**Why not one giant room per server (or one global room) carrying all presence:** Liveblocks fans out every presence update to every connected client *in that room*. A single server-wide room would mean every keystroke in every channel gets broadcast to every member of the server, even ones not looking at that channel — wasted bandwidth and irrelevant re-renders. Scoping rooms to exactly "the people who could see this typing indicator" keeps fan-out proportional to actual audience size.
**Auth model per room type:** every Liveblocks `authEndpoint` (the six `/api/liveblock-*-auth` routes) independently re-derives the room id from request-supplied data and, for server-scoped rooms, calls back into Convex (`api.serverMembers.checkMembership`) before calling `liveblocks.prepareSession(...).allow(room, FULL_ACCESS)`. **Why re-verify server membership here instead of trusting the client-supplied channel/server data:** the Liveblocks token is a bearer credential for that specific room; if the auth endpoint didn't re-check membership, any authenticated Mesh user could request a Liveblocks session for *any* channel id and see live typing/presence in servers they were never a member of. This endpoint is the actual authorization boundary for Liveblocks access — it can't be enforced client-side.
**Reconnection/ordering:** delegated entirely to the Liveblocks client SDK (`LiveblocksProvider`/`RoomProvider`/`useMyPresence`/`useOthers`) — not custom code in this repo. **[Inference]** Presence is last-write-wins per connection by nature (there's no "message log" to replay — presence is a live snapshot), so there's no meaningful "duplicate/out-of-order typing event" problem to solve; if a reconnect happens, the client simply re-sends its current presence state.

### 7.3 mesh-wss — the standalone presence WebSocket service
**Why real-time communication is needed here specifically:** online/offline detection fundamentally requires knowing when a **connection drops**, which is not something a request/response protocol (or even Convex's reactive queries, which are pulled/pushed on data change, not on socket lifecycle) can observe. You need something holding an open, long-lived connection whose closing *is itself* the offline signal.
**Why WebSockets over polling or long-polling for this specifically:**
  - **Polling** ("call an endpoint every N seconds saying I'm alive") means either false "online" for up to N seconds after a crash/tab-kill, or hammering the backend with heartbeats from every connected user at all times.
  - **Long-polling/SSE** are one-directional/half-duplex and still don't give you a clean, low-latency "the OS/browser tore down this TCP connection" signal the way a `ws close` event does.
  - **WebSockets + ping/pong heartbeat** (implemented exactly this way in `apps/mesh-wss/src/index.ts`) give an authoritative "this specific connection is gone" event within one heartbeat interval, which is the actual requirement.
**Why a *separate standalone service* (`apps/mesh-wss`) instead of embedding this in `mesh-app`'s Next.js server:**
  - **Serverless/edge deployment constraints [Inference from architecture]:** Next.js apps deployed to platforms like Vercel (the README states mesh-app is hosted on Vercel) are typically stateless/serverless per-request and don't support holding thousands of long-lived, always-on WebSocket connections in a single durable process the way a plain long-running Node process can. `mesh-wss` is deployed separately (README says Railway; the client code in `PresenceTracker.tsx` even points at `wss://mesh-turborepo.onrender.com`) specifically because it needs a *persistent process*, not request-scoped compute.
  - **Failure isolation:** if the presence service crashes or is redeployed, messaging/servers/roles/etc. (all on Convex, independent of mesh-wss) keep working perfectly — only presence accuracy degrades temporarily. If presence logic were embedded in the main app process, a bug in heartbeat handling could threaten the availability of the entire product surface.
  - **Different scaling dimension:** presence connections scale with *concurrently online users regardless of activity*, while the main app's compute scales with *request/mutation volume*. Separating them means each can be sized/scaled independently.
  **What this separation costs:** an extra service to deploy/monitor, a second WebSocket connection per browser tab (Convex's + mesh-wss's), and a network hop for every status change (`mesh-wss` → HTTP POST → `/api/mark-status` → Convex mutation) instead of a single in-process update — i.e., presence updates take strictly longer to reach the database than if `mesh-wss` could write to Convex directly. **[Inference]** it likely goes through the Next.js route rather than calling Convex directly from `mesh-wss` so that the Convex deployment URL/credentials and the `updateEffectiveStatus` business logic stay behind the main app's boundary rather than being duplicated into a second codebase.

**Connection lifecycle in `mesh-wss/src/index.ts`, in detail:**
1. On `wss.on("connection")`: validate `Origin` header against an explicit allowlist (`allowedOrigins`) — origin isn't a request the client can spoof from a browser context, so this closes off arbitrary third-party sites from opening sockets against the service (basic CSWSH — cross-site WebSocket hijacking — mitigation).
2. Extract `userId` from the query string (`?userId=<id>`) — **no token/JWT verification of the userId happens here.** **Security gap, explicitly flagged rather than glossed over:** any client that can reach this WebSocket endpoint can claim to be any `userId` and flip that user's presence to online/offline at will, since the server trusts the query parameter at face value. **Current implementation → Problem → Better implementation → Trade-off:** pass the Convex-issued auth token as a query param/header and verify it server-side (mesh-wss already depends on `jsonwebtoken` and `convex` packages — the pieces are present but unused for this) before trusting `userId`. Trade-off: extra verification cost per connection and a dependency on Convex Auth's token format/verification in a second codebase.
3. **Heartbeat:** every 10s, if the peer didn't respond to the previous `ping()` (tracked via a boolean `isAlive`, flipped `true` on `pong` and `false` right before the next ping), the socket is force-closed (`4000, "No heartbeat"`). This reclaims connections from clients that vanished without a clean TCP close (phone locked, laptop lid closed, network blackhole) — the entire reason presence can be trusted at all despite no clean disconnect in those cases.
4. **Multi-tab / multi-device support (`concurrentConnectionsMap: Map<userId, count>`):** opening a second tab increments the count but does **not** re-mark the user online (already online); closing one tab decrements but only marks *offline* when the count reaches zero. **Why a ref-count instead of a boolean:** without it, closing tab 1 of 2 open tabs for the same user would incorrectly mark them offline while tab 2 is still active and the user is clearly present. This is the single most important correctness detail in the whole presence subsystem.
**Failure scenario — what happens if `mesh-wss` itself crashes/restarts:** `concurrentConnectionsMap` is in-memory and unpersisted, so a restart loses all connection counts; every currently-connected client's socket drops, their browser's `ws.onclose` fires (no reconnect logic currently attached client-side — see gap below), and no explicit "mark everyone offline" sweep runs on the server side either. **Not implemented in the current project:** client-side auto-reconnect (`PresenceTracker.tsx`'s `ws.onclose` handler only logs `"Disconnected"` — it does not attempt to reopen the connection), and there is no stale-session sweep/expiry on the Convex side independent of an active `mesh-wss` connection telling it "offline." **Trade-off of the current design:** simplicity (no reconnect backoff logic, no server-side reconciliation job) at the cost of presence potentially getting stuck "online" for users whose `mesh-wss` connection died silently without either side's cleanup path running (e.g., service restart) until they reconnect for an unrelated reason.

**What happens with multiple `mesh-wss` instances behind a load balancer (horizontal scaling):** the `concurrentConnectionsMap` is a plain in-process `Map`, **not** backed by Redis or any shared store. **This means the ref-counting multi-tab logic is only correct within a single process.** If a user's two tabs land on two different `mesh-wss` instances (e.g., behind a round-robin load balancer), each instance independently thinks it saw "0→1" for that user and both will fire a redundant (harmless, idempotent-ish) "online" POST, and each will independently fire "offline" when *its* connection closes — so a user could be marked offline by instance B closing its connection even though instance A's connection (a different tab) is still open. **Currently implemented:** correct multi-tab handling only under a single `mesh-wss` process. **How I would scale it further:** move `concurrentConnectionsMap` into Redis (`INCR`/`DECR` on `presence:{userId}`) so the count is shared across all instances, and use Redis pub/sub (or a Convex scheduled function) to reconcile cases where an instance dies without decrementing. This is a genuine, currently-real scaling boundary — not a hypothetical.

---

## 8. Frontend Architecture

**Component structure:** feature-oriented, not type-oriented — `src/features/<domain>/{api,components,store}` (e.g., `features/channels/api/useCreateChannel.ts`, `features/channels/store/useCreateChannelModal.tsx`) colocates a domain's data hooks, UI, and local state, while `src/components` holds cross-cutting/presentational pieces and `src/components/rooms` holds the six Liveblocks/LiveKit room wrapper variants (`ChannelRoom`, `MemberRoom`, `FriendRoom`, `FriendThreadRoom`, `ServerThreadRoom`, `VoiceRoom`). `src/app` is pure Next.js App Router routing/layout, deliberately kept thin — pages compose components rather than containing logic themselves. **Why feature folders over type folders (`/hooks`, `/components`, `/api` at the top level for everything):** as the number of domains grew (auth, channels, friends, messages, reactions, roles, servers, serverMembers, upload, voice, conversations — 11 feature folders), colocating each domain's query hooks next to the components that use them keeps a change to "how friend requests work" touching one folder instead of three scattered top-level ones.

**Server state vs. client state — the project draws this line very deliberately across three different tools, and this is worth defending explicitly:**
| State category | Tool | Example |
|---|---|---|
| Server-owned, needs to sync across users/tabs and survive refresh | **Convex queries/mutations** (`convex/react`) | messages, servers, roles, members |
| Ephemeral, cross-user, doesn't need persistence | **Liveblocks presence** | typing indicators |
| Client-only, but should survive a page navigation via the URL (shareable/back-button-able) | **`nuqs` (URL query state)** | `useFriendProfileId`, `useProfileMemberId`, `useParentMessageId` — "which panel is open" |
| Client-only, ephemeral, not shareable via URL | **`zustand`** | `useCreateChannelModal` (modal open/closed), `useVoiceRoomProps`, `useVoiceRoom` (is a call active) |

**Why `nuqs` for panel state instead of plain `useState`/zustand:** which thread/profile panel is open is exactly the kind of UI state a user expects to survive a refresh or be shareable/back-button-navigable (Discord's own UI keeps the open thread in the URL) — `useQueryState` persists it in the URL query string for free, whereas `zustand`/`useState` would lose it on refresh.
**Why `zustand` (not React Context) for cross-tree ephemeral state like `useVoiceRoomProps`:** the active voice call's props need to be read/written from widely separated parts of the tree (wherever a "join voice" button lives, and the always-mounted `VoiceRoomWrapper` in the root layout) without forcing a Context Provider re-render cascade across the whole app on every keystroke-adjacent state change; zustand's subscription model only re-renders components that actually read the specific slice that changed.
**No React Query/SWR anywhere:** unnecessary — Convex's `useQuery`/`usePaginatedQuery`/`useMutation` *already* provide caching, reactivity, and loading states as first-class primitives (`useCreateMessage.ts` hand-rolls its own pending/error/settled state around `useMutation` rather than relying on a separate data-fetching library, because Convex's own hooks are the fetching library here).

**Optimistic updates:** **Not implemented in the current project.** `useCreateMessage`, `useCreateFriendMessage`, etc. all `await create(...)` and only update local `isPending`/`error` state — the message appears in the UI only once Convex's reactive query subscription pushes the committed data back down, not before. **Trade-off:** perceived latency is bound by round-trip time to Convex (typically fast, but not zero) rather than instant; the upside is there is zero "reconcile the optimistic entry with the real one" logic or rollback-on-failure UI to get wrong.
**Loading states:** a small `Loader` component with a `message` prop is reused everywhere (`Room.tsx`, `ChannelRoom.tsx`, `VoiceRoom.tsx`) rather than each screen inventing its own spinner — a simple but effective consistency choice.
**Rendering/perf-relevant choices [Inference from code shape]:** `dynamic(() => import("@/components/Editor"), { ssr: false })` for the Quill-based rich text editor in every `ChatInput` — Quill manipulates the DOM directly and isn't SSR-safe, so it's excluded from the server render and code-split into its own client chunk, keeping it out of the initial page bundle for routes that don't show a chat input yet.
**Message list rendering (`MessageList.tsx`):** messages are grouped client-side by calendar day (`groupedMessages` reduce over `data`) purely for the "Today / Yesterday / Wednesday, September 2" date-separator UI — this is presentation grouping, not a data-fetching concern, and correctly kept out of the Convex query itself. The container uses `flex-col-reverse` with `desc`-ordered data from the paginated query, which is the standard trick for chat UIs to keep newest messages pinned to the bottom while allowing "load more" (older messages) at the top without manual scroll-position math on every render.

---

## 9. Caching / Storage

- **Convex query caching:** built into the platform — subscribed queries are cached and only recomputed when their underlying data actually changes; the app never manually caches Convex results.
- **File storage:** Convex's built-in blob storage (`ctx.storage.generateUploadUrl()` / `ctx.storage.getUrl()`), used for message images (`messages.image` / `friendMessages.image` as `v.id("_storage")`).
- **Redis: Not implemented in the current project.** There is no Redis (or any external cache) anywhere in the codebase or dependency list. All "caching" is either Convex's own subscription cache or nothing.
- **Why no Redis was needed here, and where it *would* become necessary:** Redis is typically introduced for (a) sharing state across multiple stateless server instances, or (b) absorbing read load a primary DB can't sustain. Convex already solves (a) for the reactive-query path (it's a managed, centrally-consistent service, not per-instance state), and (b) hasn't been a problem at this project's current scale. The one place in this codebase that **would** need a Redis-equivalent under horizontal scaling is exactly `mesh-wss`'s in-memory `concurrentConnectionsMap` (§7.3) — flagged there as the concrete scaling gap, rather than hand-waved as "add Redis everywhere."

---

## 10. Algorithms & Data Structures (in the context of this project, not generically)

1. **`Map<string, {count, members}>` for reaction de-duplication** (`messages.ts`/`friendMessages.ts` `ReactionMap`): grouping N raw reaction rows into per-emoji aggregates. **Complexity:** O(n) time / O(k) space where n = raw reactions on a message, k = distinct emoji used — a hash map is the natural structure since the "key" (emoji value) has no ordering requirement and lookups need to be O(1) amortized while iterating once. **Alternative:** sorting reactions by emoji then run-length-encoding adjacent groups — O(n log n), strictly worse, with no benefit since output order isn't required to be sorted (the client re-sorts/positions reactions however it wants).
2. **`Map<userId, count>` ref-counting for multi-tab presence** (`mesh-wss`): a classic reference-counting pattern (same idea as `shared_ptr`/refcounted GC) applied to "how many open sockets does this user currently have," using a hash map for O(1) increment/decrement/lookup keyed by `userId`. **Why not a `Set<socket>` per user instead of a raw count:** a count is sufficient because the only question ever asked is "is this now zero," not "which specific sockets does this user have" — a smaller, simpler structure for the actual requirement. **Trade-off:** a `Set<socket>` would additionally let you message all of one user's specific connections directly (e.g., for a future "force logout all your tabs" feature) — not needed today, so not built.
3. **Self-referential adjacency for channel categories** (`channels.parentId`): channels form a very shallow (2-level in practice: category → channel) tree via parent pointers rather than an explicit adjacency-list/tree-traversal structure or materialized path. **Why not a full recursive/graph traversal:** the tree is never deeper than 2 levels in the current UI (categories cannot themselves have parents in the creation flow), so a simple `.index("byServerAndParentId")` lookup ("children of node X") is sufficient; a generalized recursive-CTE-style traversal (needed for arbitrary-depth trees in SQL) would be solving a problem this project doesn't have.
4. **Canonical pair ordering (`[a,b].sort()` / ternary min/max) for conversations and friend requests:** used four times (`friendRequests`, `friendConversations`, `serverConversations`) to collapse an unordered pair into one deterministic key so a compound/composite index can find "the" relationship row in O(1) instead of needing two lookups (`(A,B)` then `(B,A)`) or an OR query Convex indexes don't support well. This is the same trick as canonicalizing undirected graph edges (`min(u,v), max(u,v)`) to deduplicate them in an edge set.
5. **Cursor-based pagination as an implicit linked traversal over a B-tree-like index:** conceptually, Convex's `.paginate()` over an index is walking a sorted index structure and handing back an opaque cursor (effectively "the index key of the last item returned"), which is why it's stable under concurrent inserts (§4.4) — the same principle as keyset pagination in SQL (`WHERE (created_at, id) < (last_created_at, last_id) ORDER BY … LIMIT n`), just done for you by the platform.

---

## 11. Authentication & Security

| Mechanism | Present? | Where |
|---|---|---|
| Session-based auth via Convex Auth (Password/GitHub/Google) | ✅ | `convex/auth.ts` |
| Per-function auth check (`getAuthUserId`) | ✅ | virtually every query/mutation |
| Server membership check before any server-scoped action | ✅ | `checkMember`, `uniqueMembership` index, repeated per-function |
| Role/permission-based authorization (RBAC) | ✅ | `checkPermission`, `SERVER_PERMISSIONS` |
| Owner-bypass and Administrator-bypass semantics | ✅ | `checkPermission` |
| Origin allowlisting on the presence WebSocket | ✅ | `mesh-wss/src/index.ts` `allowedOrigins` |
| Per-room authorization for Liveblocks (re-checks Convex membership before issuing a token) | ✅ | the 6 `liveblock-*-auth` routes |
| Server-side secret usage for third-party tokens (never shipped to client) | ✅ | `LIVEKIT_API_SECRET`, `LIVEBLOCKS_SECRET_KEY` read from `process.env` only inside Route Handlers |
| Input validation on all Convex function arguments | ✅ | every function declares a `v.*` args schema; malformed calls are rejected before the handler runs |
| SQL injection | N/A | no SQL; Convex's query builder is not string-interpolated |
| NoSQL injection | ✅ mitigated by construction | Convex's typed query builder (`q.eq(...)`) doesn't accept raw query strings, so there's no analogous injection surface |
| XSS from user message content | **Not verified in the current project** | messages are rendered via a `Renderer.tsx`/Quill Delta-based renderer, not raw `dangerouslySetInnerHTML` of user HTML — but no explicit sanitization step was located in this analysis |
| CSRF | **Not implemented / not clearly applicable** | Convex functions are called via its own client SDK with bearer-token auth (not cookie-based form submission), which is inherently less CSRF-prone than cookie-session-based POST forms, but this project does not implement any explicit CSRF token scheme |
| Rate limiting | **Not implemented in the current project** | no rate limiting on message creation, friend requests, join attempts, or the `/api/mark-status` endpoint |
| Presence WebSocket identity verification | ❌ **gap** | `userId` is trusted from an unauthenticated query string (§7.3) |
| Secrets management | ✅ via environment variables | `.env`-style vars (`LIVEBLOCKS_SECRET_KEY`, `LIVEKIT_API_SECRET`, `CONVEX_SITE_URL`, etc.) — never committed, never sent to the client bundle (all consumed only in Route Handlers / Convex, not `NEXT_PUBLIC_*`) |
| File upload validation | ❌ **gap** | no MIME/size checks before accepting an upload (§4.9) |
| Data exposure in queries | ✅ mostly | `userDetailsById` explicitly hand-picks a safe field subset to return rather than spreading the raw user document (which would leak internal auth fields); most other `populateUser`/`populateMember` calls do return full documents to any authorized member of the same server, which is an acceptable scope for a Discord-style app where server members can see each other's basic profile info |

**The two most defensible security answers for an interview:** (1) authorization is enforced *redundantly, per-function*, not by a single trusted middleware — meaning a reviewer can audit any single mutation in isolation and know exactly what protects it; (2) the presence WebSocket's trust of an unauthenticated `userId` is a known, explainable gap with a concrete fix (verify a Convex-issued token before trusting the claimed identity), not an oversight the candidate is unaware of.

---

## 12. Error Handling & Reliability

**Pattern used almost everywhere:** throw `ConvexError("human-readable message")` (or occasionally a plain `Error`) as soon as a precondition fails (`!userId`, `!member`, `!isPermitted`, not found, etc.), before any mutation. Convex surfaces `ConvexError` messages to the client's `catch` block distinctly from internal errors, so the client (`useCreateMessage`, etc.) can show the actual message via toast (`errorToast` in `src/lib/toast.tsx`) rather than a generic failure. **Why throw-early guard clauses instead of nested if/else or a Result/Either type:** guard clauses keep each function's "happy path" as a short, linear final block, and Convex's error surface is exception-based already, so fighting that with a custom Result type would add ceremony without a corresponding benefit in a functions-as-transactions model.
**Inconsistency worth naming explicitly (a real, minor code smell):** some functions mix bare `throw new Error(...)` and `throw new ConvexError(...)` within the same file (e.g., `messages.ts` uses both), and `servers.ts` wraps several handlers' bodies in `try { … } catch (error) { console.error(error) }` and **implicitly returns `undefined`** on failure instead of re-throwing — meaning a client awaiting `createServer`/`renameServer`/`deleteServer` on failure gets `undefined` back rather than a rejected promise/thrown error it can `catch`. **Current implementation → Problem → Better implementation → Trade-off:** swallowing the error server-side means the client's own `try/catch` around the mutation call never fires, so UI error toasts for these specific operations may silently no-op instead of informing the user; removing the try/catch (or re-throwing inside the catch block) would restore consistent client-side error handling at the cost of Convex logging these as function errors in its dashboard (arguably a *good* trade, since visibility into failures is generally preferable to silent swallowing).
**Duplicate operations (idempotency):** explicitly guarded in the places that matter — `joinServer` checks `existingMember` before inserting, `createFriendRequest` checks `isFriendRequestExists`, `toggleReaction`/`toggleFriendReaction` check-then-toggle. **Not guarded:** `createMessage` has no idempotency key, so a double-submit (e.g., a flaky network causing the client to retry a mutation call) could in principle create two identical messages — **[Inference]** low real-world impact since Convex mutations aren't silently retried by the client SDK on the happy path the way, say, an HTTP POST behind a naive retrying proxy might be, but there is no explicit request-id/idempotency-key mechanism in this codebase to fully rule it out.
**Concurrent operations on the same entity:** covered per-feature above (reactions are toggle-safe via the compound index; friend requests have a real gap; role/permission checks are re-evaluated fresh every time rather than cached, which avoids stale-permission bugs under concurrent role edits).
**Client crash mid-operation:** since there's no multi-step client-side transaction (each user action is a single mutation call), a client crashing mid-upload leaves, at worst, an orphaned Convex storage blob with no message ever pointing at it (if the crash happens between the upload POST and the `createMessage` call) — **not implemented:** any cleanup/garbage-collection job for storage blobs uploaded but never attached to a message.

---

## 13. Scalability

Distinguishing **currently implemented** from **how I would scale it further**, per component:

| Component | 10 users | 10,000 users | 1,000,000 users |
|---|---|---|---|
| **Convex (messages/servers/roles/etc.)** | Trivial; single reads dominate | **Currently implemented:** indexed point-lookups and cursor pagination already avoid the classic offset-pagination and full-table-scan failure modes, so this tier is handled by the existing design | **How I'd scale further:** the N+1 fan-out in `getMessages`/`getFriendMessages` (member+user+reactions+thread per message) would need to become batched/denormalized (e.g., store a denormalized `authorName`/`authorImage` snapshot on the message row at write time, avoiding a join-equivalent per read) since read amplification scales with messages-per-page × active-readers |
| **`mesh-wss` presence** | One process handles it trivially | **Currently implemented:** heartbeat + ref-counted multi-tab handles this correctly *as long as it's a single process* | **Currently a hard bottleneck (see §7.3):** the in-memory `concurrentConnectionsMap` doesn't survive horizontal scaling to multiple `mesh-wss` instances behind a load balancer. **How I'd scale it:** move connection counts into Redis (shared `INCR`/`DECR`), and route each user's connections consistently or reconcile via a shared store rather than per-process memory |
| **Liveblocks typing/presence** | Trivial | Handled by Liveblocks' own infrastructure — the app only controls *room granularity* (§7.2), which is already scoped tightly (per-channel/per-DM/per-thread) rather than server-wide, which is what keeps fan-out proportional to actual audience at any scale |
| **LiveKit voice/video** | Trivial | Handled by LiveKit's SFU infrastructure; the app's job is only correct, minimal-scope token minting (`/api/livekit`), which it does | Same — media scaling is LiveKit's problem, not this app's, by design |
| **File storage** | Trivial | **Currently implemented:** direct browser-to-Convex-storage upload avoids the app server ever being a bandwidth bottleneck for uploads, which is the one part of this tier that *was* proactively designed for scale | **How I'd scale further:** add a CDN in front of served images if Convex storage's own delivery becomes a bottleneck, plus image resizing/variants pipeline (currently absent) |
| **Server/channel deletion fan-out** | Trivial | Still fine — fan-out delete size scales with one server's data, not global data | **How I'd scale further:** for very large, old servers, move the fan-out delete (`deleteServer`, `removeMember`) into a Convex scheduled/background function that paginates and deletes in batches, rather than a single mutation loading entire result sets via `.collect()` — `.collect()` on unbounded result sets is the concrete ceiling here |

**Do not claim more than is implemented:** there is no explicit database sharding/partitioning, no read replicas, no CDN configuration, and no load balancer configuration visible in this codebase — Convex and the third-party services (Liveblocks/LiveKit) abstract those concerns away from the application code, which is itself a valid and honest scaling story ("I offloaded the hardest scaling problems to platforms whose entire job is solving them"), not a gap to apologize for.

---

## 14. Important Engineering Decisions

| Decision | Why | Alternative | Trade-off |
|---|---|---|---|
| **Convex as the entire backend + database** | Reactive queries eliminate hand-built WebSocket fan-out/cache-invalidation for all persisted data; transactional mutations colocate business logic and DB access | Postgres/Mongo + REST/GraphQL API + Redis pub-sub + custom WS gateway | Vendor lock-in to Convex's query/index model (no arbitrary joins/SQL); huge reduction in infra code to write/operate |
| **Three separate real-time systems (Convex, Liveblocks, mesh-wss) instead of one** | Each solves a structurally different problem (durable data sync vs. ephemeral presence vs. connection-lifecycle detection) that the others can't cleanly solve | One custom WebSocket gateway for everything | More systems to operate/secure, but each is far simpler and better-suited to its one job |
| **Separate `mesh-wss` process instead of embedding presence in the Next.js app** | Needs a long-lived process for heartbeat/connection tracking, which serverless Next.js hosting doesn't naturally provide; isolates presence failures from the rest of the product | Embed WS server in Next.js custom server | Extra deployment, extra network hop (`mesh-wss` → `/api/mark-status` → Convex) vs. potential availability blast radius if embedded |
| **Cursor-based pagination for messages** | Stable under concurrent inserts; O(page size) regardless of scroll depth | Offset/page-number pagination | Loses "jump to page N" UX (not needed for chat) |
| **`roleIds` array on `serverMembers` instead of a join table** | Role lists per member are small and read on every permission check; avoids an extra indexed query on the hottest path in the app | `memberRoles(memberId, roleId)` join table | Role add/remove is a full-array patch; would degrade only if members could hold very many roles (not realistic here) |
| **Parallel `friend*` tables/functions instead of reusing server `messages`/`reactions`** | Friend DMs have no `serverId`/`serverMemberId` to hang off of; server-scoped tables can't represent them | Unified `messages` schema with nullable server vs. user author fields | Duplicates message/reaction/thread logic almost entirely — the clearest refactor opportunity in the codebase |
| **Direct browser → Convex storage upload (no server proxy)** | Avoids the app server handling file bytes at all; zero extra infra (no S3/CORS setup) | Proxy upload through a Route Handler; separate object store (S3/R2) | Tied to Convex storage's feature set/limits/pricing; no image processing pipeline |
| **Per-function repeated auth/permission checks instead of shared middleware** | Convex has no middleware chain; each function is independently auditable | A wrapper/higher-order function around every handler | Some repetition across files, but zero "invisible" authorization happening outside the function you're reading |
| **Liveblocks rooms scoped as narrowly as possible (per-channel/DM/thread, not per-server)** | Keeps typing-indicator fan-out proportional to actual audience | One room per server for all presence | More distinct room ids/auth endpoints to maintain (6 separate `/api/liveblock-*-auth` routes) |

---

## 15. Alternatives & Trade-offs Summary

Already threaded through every section above; the highest-signal ones to have crisp two-sentence answers for in an interview:
1. **Convex vs. traditional SQL+API+cache stack** — reactive-by-default vs. maximum flexibility/maturity/ecosystem.
2. **Cursor vs. offset pagination for messages** — correctness under concurrent writes vs. page-jump UX.
3. **Denormalized `roleIds` array vs. join table** — hot-path read speed vs. relational cleanliness at large role counts.
4. **Separate presence microservice vs. embedded** — long-lived-connection capability + failure isolation vs. deployment/operational simplicity.
5. **Duplicated friend-messaging model vs. unified schema** — implementation simplicity per-feature vs. long-term DRY-ness; explicitly named as the biggest "what would you change" answer.

---

## 16. Potential Weaknesses / Improvements (Consolidated)

1. **Presence WebSocket trusts an unauthenticated `userId` query param** — anyone can spoof any user's online/offline status. Fix: verify a Convex auth token server-side in `mesh-wss` before trusting identity.
2. **`concurrentConnectionsMap` is in-process memory** — breaks multi-tab correctness the moment `mesh-wss` is horizontally scaled to >1 instance. Fix: shared store (Redis) for connection counts.
3. **Duplicated messaging/reactions logic between server and friend contexts** — real maintenance risk (a bug fix in `messages.ts` must be remembered and re-applied in `friendMessages.ts`). Fix: unify under one schema with nullable author-context fields, at the cost of messier conditional logic per function.
4. **`friendRequests` duplicate-request race window** — read-then-insert on the canonical pair isn't fully closed against concurrent double-submits. Fix: rely on a genuinely unique index/constraint if Convex offers one, or a compare-and-swap-style insert pattern.
5. **Several `servers.ts` mutations swallow errors** (`try { … } catch { console.error(error) }`, implicit `undefined` return) instead of re-throwing, silently defeating client-side error handling for those specific operations.
6. **No file-upload validation** (type/size) before accepting an image upload.
7. **No rate limiting** anywhere (message creation, friend requests, join attempts, presence POSTs) — currently relies entirely on the honesty of authenticated clients and Convex's/Vercel's/Railway's platform-level protections, if any.
8. **No client-side WebSocket reconnect logic** in `PresenceTracker.tsx` — a dropped presence connection is not retried, only logged.
9. **`removeMember`'s permission check reads oddly:** `checkPermission(MANAGE_MEMBERS) || currentMember._id !== member._id` — worth naming explicitly as a likely logic bug (this seems to grant removal permission whenever the target is *not* the current member, i.e., the opposite of "let anyone remove themselves"; the probable intent was `currentMember._id === member._id` to allow self-removal/"leave server" in addition to admin-driven removal). **Current implementation → Problem → Better implementation → Trade-off:** change `!==` to `===`; trade-off is purely a correctness fix with no downside — flagged here as exactly the kind of "read your own code critically" finding an interviewer respects.

---

## 17. End-to-End Flows

### Flow A — Sending a channel message with an image
`ChatInput` (channel variant) → `useGenerateUploadUrl` calls `convex/upload.ts:generateUploadUrl` → browser POSTs file bytes straight to the returned Convex storage URL → gets `storageId` → `useCreateMessage` calls `convex/messages.ts:createMessage({ body, image: storageId, serverId, channelId })` → handler verifies auth, membership (`checkMember`), permission (`SEND_MESSAGES`) and mute status, inserts into `messages` → every client with an open `usePaginatedQuery(api.messages.getMessages, {channelId})` for that channel (Convex tracks these subscriptions automatically) has its query recomputed and pushed over its WebSocket → `MessageList` re-renders with the new message grouped under today's date divider, image resolved via `ctx.storage.getUrl` inside the query handler itself.

### Flow B — Creating a server and immediately seeing it
`createServer` mutation inserts server → `@everyone` role → 2 category channels → 2 default channels → the creator's `serverMembers` row, all inside one transaction → the client's `getServers` query (subscribed on the servers list page) automatically includes the new server the instant the mutation commits, no manual refetch.

### Flow C — Joining a voice channel
User clicks a voice channel → `useVoiceRoomProps.setProps({channelId, serverId, type:"server", audio, video})` (zustand, global) → the always-mounted `VoiceRoomWrapper`/`VoiceRoom` (rendered once in root layout) reacts to the prop change → computes a deterministic room name (`"server" + serverId + channelId`) → `GET /api/livekit?room=…&useremail=…` mints a scoped LiveKit token server-side → `<LiveKitRoom>` connects via WebRTC to LiveKit's SFU, independent of Convex/Liveblocks entirely from this point on.

### Flow D — Going online, then closing your laptop
Sign-in → `PresenceTracker` opens a `mesh-wss` WebSocket with `?userId=<id>` → connection count 0→1 → `mesh-wss` POSTs `{userId, status:"online"}` to `/api/mark-status` → Convex mutation `updateEffectiveStatus` sets `effectiveStatus:"online"` (respecting any `manualStatus` already set) → every UI element querying that user's presence updates live. Laptop lid closes without a clean disconnect → next `ping()` from `mesh-wss` gets no `pong` within 10s → socket force-closed → `close` handler decrements the count to 0 → POSTs `status:"offline"` → Convex sets `effectiveStatus:"offline"` regardless of `manualStatus` → presence UI updates live again.

---

## 18. Interview Questions + Strong Answers

### Basic
**Q: What does this project do?**
A: Mesh is a Discord-style real-time chat platform — servers with role-permissioned text/voice channels, threaded conversations, a friend/DM system, emoji reactions, live presence, and voice/video calls — built as a Turborepo monorepo with a Next.js/Convex app and a standalone presence WebSocket service.

**Q: Why did you build it?**
A: To get hands-on with the hardest parts of real-time full-stack engineering in one project: reactive data sync at multiple scopes, RBAC authorization, presence/connection-lifecycle handling, and integrating third-party real-time infra (Liveblocks, LiveKit) alongside a reactive database (Convex).

**Q: Explain the architecture.**
A: Convex is the single source of truth and the reactive backend for all persisted data (messages, servers, roles, etc.) — its queries push updates to clients automatically. Liveblocks handles ephemeral, high-frequency presence (typing indicators) scoped per-room so it never touches the database. A standalone Node WebSocket service (`mesh-wss`) exists purely to detect TCP-level connect/disconnect for online/offline presence, since that's something neither Convex nor a request/response API can observe. LiveKit handles voice/video media over WebRTC, entirely separate from the data layer.

### Intermediate
**Q: Why did you choose Convex over a traditional database?**
A: Because reactive queries eliminate the need to hand-build WebSocket broadcast/cache-invalidation logic for every feature — a mutation's effects are automatically pushed to every subscribed client. Transactional mutations also colocate business logic and DB writes, so multi-table operations like `deleteServer`'s fan-out delete across five tables are atomic without explicit transaction management.

**Q: Why this schema — specifically, why one `messages` table for channel messages, DMs, and thread replies?**
A: Because editing, deleting, reacting to, and threading from a message behaves identically regardless of where it lives; a single table with optional discriminator foreign keys (`channelId`/`conversationId`/`parentMessageId`) keeps that shared logic in one place instead of tripling it. The trade-off is the schema alone doesn't enforce "exactly one of these is set" — that's enforced by the mutation logic.

**Q: Why WebSockets for presence, and why a separate service?**
A: Detecting "this user disconnected" fundamentally requires an open, long-lived connection whose closing is itself the signal — polling can't give you that without either latency or load, and Convex's reactive queries react to data changes, not socket lifecycle. It's a separate service because it needs a persistent, always-running process (for heartbeats and in-memory connection tracking), which doesn't fit a serverless Next.js deployment model, and because isolating it means a presence bug can't take down messaging/servers/etc.

**Q: Why this caching strategy — or lack of one?**
A: Convex's subscription model *is* the cache — subscribed queries are automatically kept fresh without a separate invalidation layer. Redis was never introduced because nothing in the app currently needs cross-instance shared state for the database path; the one place that genuinely would benefit from a shared cache/store is `mesh-wss`'s in-memory connection-count map if it were scaled to multiple instances.

**Q: Why cursor-based pagination for messages instead of offset?**
A: Chat history is a continuously-growing, concurrently-written table. Offset pagination silently skips/duplicates rows when new messages are inserted while a user scrolls, because "page 2" is redefined by every insert. Cursor pagination anchors to a stable position in the index, so it's correct under concurrent writes and stays O(page size) regardless of scroll depth.

### Advanced
**Q: How would you scale this to 10 million users?**
A: The persisted-data path (Convex) already uses indexed lookups and cursor pagination, which are the right primitives at that scale, though the N+1 fan-out per message (author, reactions, thread info) would need to become denormalized/batched to keep read amplification in check. The concrete, already-identified bottleneck is `mesh-wss`'s in-memory connection-count map, which is only correct for a single process — at that scale I'd move it to a shared store (Redis `INCR`/`DECR`) so multi-tab presence stays correct across horizontally-scaled instances. Liveblocks and LiveKit scaling is delegated to those platforms by design.

**Q: What happens if a WebSocket server (mesh-wss) crashes?**
A: All currently-connected clients' sockets drop; each client's `ws.onclose` currently only logs the disconnect with no reconnect attempt (a known gap), and there's no server-side "mark everyone offline" sweep on crash — so presence for previously-connected users can be stuck stale until they naturally reconnect (e.g., navigate again). Messaging, servers, and all Convex-backed features are completely unaffected, since presence is architecturally isolated from them.

**Q: How would you prevent duplicate events (e.g., duplicate messages, duplicate friend requests)?**
A: Reactions already solve this correctly via a compound uniqueness index checked before insert/delete inside a single transactional mutation. Friend requests have a real, currently-unmitigated race window (read-then-insert on the canonicalized pair isn't atomic against a genuinely unique constraint) — the fix would be an actual unique index/constraint if the platform supports enforcing one at write time, or a compare-and-swap insert pattern.

**Q: How would you handle concurrent updates (e.g., two admins editing the same role's permissions at once)?**
A: Convex serializes mutations that touch the same documents, so the two writes won't corrupt each other — but the second writer's changes would simply overwrite the first's (last-write-wins on the whole `permissions` array), since there's no optimistic-concurrency version check on the role document today. That would be the next thing I'd add if concurrent role editing by multiple admins were a real, common scenario.

**Q: How would you partition the database?**
A: Not currently needed or implemented — Convex handles storage/scaling internally rather than exposing manual sharding to the application. If I had to reason about it conceptually, the natural partition key for this domain is `serverId` (almost every hot table — channels, roles, serverMembers, messages — is already indexed by `serverId` first), since a "server" (guild) is the natural unit of data locality and almost no query needs to span multiple servers at once.

**Q: What happens if Redis goes down?**
A: Not applicable today — Redis isn't part of this system. If the suggested Redis-backed presence-count store from the scaling plan were added, its failure would degrade multi-instance presence accuracy (potentially double-counting or losing connection counts across instances) without affecting the Convex-backed core product, consistent with how every other piece of this architecture is designed to fail independently rather than cascade.

**Q: How would you make this highly available?**
A: Convex, Liveblocks, and LiveKit are all already managed platforms with their own HA guarantees, so the application-level HA work is really about `mesh-wss` and the Next.js app: running multiple `mesh-wss` instances behind a load balancer (once the connection-count store is made shared, per the Redis fix above) and relying on the hosting platform (e.g., Vercel) for Next.js redundancy, which is already how it's deployed per the README.

---

## 19. One-Page Project Explanation (for quick interview recall)

**Mesh** is a Discord-style real-time chat platform (Turborepo monorepo: `mesh-app` + `mesh-wss`) built to demonstrate real-time systems design end to end.

- **Data & core logic:** Convex — a reactive document database whose `query`/`mutation` functions are simultaneously the API layer, the transaction boundary, and the real-time push mechanism (subscribed queries auto-update on change, no manual WebSocket/cache-invalidation code needed).
- **Authorization:** RBAC modeled as `servers → serverMembers (roleIds[]) → roles (permissions[])`, resolved fresh on every check (`checkPermission`) so role edits are never stale, with an owner-bypass and `ADMINISTRATOR`-bypass baked in; every mutation independently re-verifies membership and permission rather than trusting a single middleware layer.
- **Messaging:** one polymorphic `messages` table serves channels, DMs, and threads via optional foreign keys, queried through a single compound index and paginated with cursors (correct under concurrent inserts, unlike offset pagination) — mirrored by a parallel, currently-duplicated `friendMessages` model for the server-independent friend/DM system (the clearest refactor target in the codebase).
- **Real-time, split by actual need, not by one-size-fits-all:** Convex reactivity for persisted data; **Liveblocks** for ephemeral, tightly-room-scoped typing/presence that should never hit the database; a **standalone Node WebSocket service (`mesh-wss`)**, deployed separately from the serverless Next.js app specifically because presence requires a long-lived process to detect real disconnects via heartbeat, with reference-counted multi-tab support — currently correct only within a single instance (the honestly-identified horizontal-scaling gap); **LiveKit** for WebRTC voice/video, entirely decoupled from the data layer.
- **Frontend:** Next.js App Router, feature-folder organization, and state deliberately split three ways — Convex hooks for server state, `nuqs` (URL state) for shareable UI panel state, `zustand` for ephemeral cross-tree client state (no React Query needed, since Convex's own hooks already provide caching/reactivity).
- **Known, named weaknesses** (not hidden): the presence WebSocket trusts an unauthenticated `userId`; `mesh-wss`'s connection tracking doesn't survive horizontal scaling without a shared store; friend-request creation has a race window; some `servers.ts` mutations swallow errors; there's no upload validation or rate limiting yet. Each has a concrete, stated fix and trade-off, because knowing exactly where a system is weak — and why — is the whole point of being able to defend it.
