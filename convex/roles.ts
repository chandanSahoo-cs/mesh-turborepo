import { v } from "convex/values";
import { query } from "./_generated/server";
import { serverPermissionValidator } from "./schema";
import {checkPermission} from "../src/lib/permissions"

// export const SERVER_PERMISSIONS = [
//   // Server management
//   "MANAGE_SERVER", // Rename/delete server, change settings
//   "VIEW_AUDIT_LOG", // See server activity logs (if you have them)

//   // Member management
//   "MANAGE_MEMBERS", // Kick, ban, or change member roles
//   "INVITE_MEMBERS", // Generate invite links

//   // Role management
//   "MANAGE_ROLES", // Create/edit/delete roles

//   // Channel management
//   "MANAGE_CHANNELS", // Create, edit, delete channels

//   // Category management (if you support it)
//   "MANAGE_CATEGORIES", // Create, edit, delete channel categories

//   // General communication control
//   "VIEW_CHANNELS", // View channel list (server-level fallback)
//   "SEND_MESSAGES", // Post messages in all text channels
//   "DELETE_MESSAGES", // Delete anyone's messages

//   // Voice control (if using voice)
//   "CONNECT_VOICE", // Join voice channels
//   "MUTE_MEMBERS", // Mute others in voice
//   "DEAFEN_MEMBERS", // Deafen others in voice
//   "MOVE_MEMBERS", // Move users between voice channels

//   // Admin powers
//   "ADMINISTRATOR", // Bypass all permission checks (dangerous)
// ] as const;

// get member object
// get all member roles
// merge all perms from those role
// and validate from the given role

export const hasPermission = query({
  args: {
    memberId: v.id("serverMembers"),
    permission: serverPermissionValidator,
  },
  handler: async (ctx, { memberId, permission }) => {
    const isPermitted = checkPermission({ctx,memberId,permission});
    return isPermitted;
  },
});
