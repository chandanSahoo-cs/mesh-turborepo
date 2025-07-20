import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const SERVER_PERMISSIONS = [
  // Server management
  "MANAGE_SERVER", // Rename/delete server, change settings
  "VIEW_AUDIT_LOG", // See server activity logs (if you have them)

  // Member management
  "MANAGE_MEMBERS", // Kick, ban, or change member roles
  "INVITE_MEMBERS", // Generate invite links

  // Role management
  "MANAGE_ROLES", // Create/edit/delete roles

  // Channel management
  "MANAGE_CHANNELS", // Create, edit, delete channels

  // Category management (if you support it)
  "MANAGE_CATEGORIES", // Create, edit, delete channel categories

  // General communication control
  "VIEW_CHANNELS", // View channel list (server-level fallback)
  "SEND_MESSAGES", // Post messages in all text channels
  "DELETE_MESSAGES", // Delete anyone's messages

  // Voice control (if using voice)
  "CONNECT_VOICE", // Join voice channels
  "MUTE_MEMBERS", // Mute others in voice
  "DEAFEN_MEMBERS", // Deafen others in voice
  "MOVE_MEMBERS", // Move users between voice channels

  // Admin powers
  "ADMINISTRATOR", // Bypass all permission checks (dangerous)
] as const;

export type ServerPermission = (typeof SERVER_PERMISSIONS)[number];

export const serverPermissionValidator = v.union(
  ...SERVER_PERMISSIONS.map((perm) => v.literal(perm))
);

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    effectiveStatus: v.optional(
      v.union(
        v.literal("online"),
        v.literal("idle"),
        v.literal("dnd"),
        v.literal("offline")
      )
    ),
    manualStatus: v.optional(
      v.union(
        v.literal("online"),
        v.literal("idle"),
        v.literal("dnd"),
        v.literal("offline")
      )
    ),
    lastSeen: v.optional(v.number()),
  }).index("email", ["email"]),

  friendRequests: defineTable({
    userOne: v.id("users"),
    userTwo: v.id("users"),
    initiatedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("blocked")
    ),
  })
    .index("byUserOne", ["userOne"])
    .index("byUserTwo", ["userTwo"])
    .index("byUserOneAndUserTwo", ["userOne", "userTwo"]),

  servers: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    joinCode: v.string(),
    profileImageUrl: v.optional(v.string()),
  }).index("byOwnerId", ["ownerId"]),

  serverMembers: defineTable({
    userId: v.id("users"),
    serverId: v.id("servers"),
    roleIds: v.array(v.id("roles")),
    isMuted: v.boolean(),
  })
    .index("byUserId", ["userId"])
    .index("byServerId", ["serverId"])
    .index("uniqueMembership", ["userId", "serverId"]),

  roles: defineTable({
    serverId: v.id("servers"),
    name: v.string(),
    permissions: v.array(serverPermissionValidator),
    isEveryone: v.optional(v.boolean()),
  })
    .index("byServerId", ["serverId"])
    .index("byNameAndServerId", ["name", "serverId"]),

  channels: defineTable({
    name: v.string(),
    serverId: v.id("servers"),
    type: v.union(v.literal("text"), v.literal("voice"), v.literal("category")),
    parentId: v.optional(v.id("channels")),
    topic: v.optional(v.string()),
    position: v.optional(v.number()),
  })
    .index("byServerId", ["serverId"])
    .index("byParentId", ["parentId"])
    .index("byServerAndParentId", ["serverId", "parentId"]),

  serverConversations: defineTable({
    serverId: v.id("servers"),
    member1Id: v.id("serverMembers"),
    member2Id: v.id("serverMembers"),
    lastMessageAt: v.optional(v.number()),
  })
    .index("byUser1AndByUser2AndByServerId", [
      "member1Id",
      "member2Id",
      "serverId",
    ])
    .index("byMember1", ["member1Id"])
    .index("byMember2", ["member2Id"])
    .index("byServerId", ["serverId"]),

  messages: defineTable({
    body: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    serverMemberId: v.id("serverMembers"),
    serverId: v.id("servers"),
    channelId: v.optional(v.id("channels")),
    parentMessageId: v.optional(v.id("messages")),
    conversationId: v.optional(v.id("serverConversations")),
    updatedAt: v.optional(v.number()),
  })
    .index("byServerMemberId", ["serverMemberId"])
    .index("byServerId", ["serverId"])
    .index("byChannelId", ["channelId"])
    .index("byParentMessageId", ["parentMessageId"])
    .index("byConversationId", ["conversationId"])
    .index("byChannelIdAndParentMessageIdAndConversationId", [
      "channelId",
      "parentMessageId",
      "conversationId",
    ]),

  reactions: defineTable({
    serverId: v.id("servers"),
    messageId: v.id("messages"),
    serverMemberId: v.id("serverMembers"),
    value: v.string(),
  })
    .index("byServerId", ["serverId"])
    .index("byMessageId", ["messageId"])
    .index("byServerMemberId", ["serverMemberId"])
    .index("byMemberIdAndbyMessageIdAndbyValue", [
      "serverMemberId",
      "messageId",
      "value",
    ]),
});

export default schema;
