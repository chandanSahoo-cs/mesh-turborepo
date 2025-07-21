/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as channels from "../channels.js";
import type * as friendConversation from "../friendConversation.js";
import type * as friendMessages from "../friendMessages.js";
import type * as friendRequests from "../friendRequests.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as reactions from "../reactions.js";
import type * as roles from "../roles.js";
import type * as serverConversation from "../serverConversation.js";
import type * as serverMembers from "../serverMembers.js";
import type * as servers from "../servers.js";
import type * as upload from "../upload.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  channels: typeof channels;
  friendConversation: typeof friendConversation;
  friendMessages: typeof friendMessages;
  friendRequests: typeof friendRequests;
  http: typeof http;
  messages: typeof messages;
  reactions: typeof reactions;
  roles: typeof roles;
  serverConversation: typeof serverConversation;
  serverMembers: typeof serverMembers;
  servers: typeof servers;
  upload: typeof upload;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
