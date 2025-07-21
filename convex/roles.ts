import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { checkMember } from "../src/lib/checkMember";
import { checkPermission } from "../src/lib/permissions";
import { mutation, query } from "./_generated/server";
import { serverPermissionValidator } from "./schema";

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

export const EVERYONE_ROLE = "@everyone";

export const hasPermission = query({
  args: {
    serverMemberId: v.id("serverMembers"),
    permission: serverPermissionValidator,
  },
  handler: async (ctx, { serverMemberId, permission }) => {
    const isPermitted = await checkPermission({
      ctx,
      serverMemberId,
      permission,
    });
    return isPermitted;
  },
});

export const updateRole = mutation({
  args: {
    serverMemberId: v.id("serverMembers"),
    roleId: v.id("roles"),
  },
  handler: async (ctx, { serverMemberId, roleId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("User Unauthorized");
    }

    const role = await ctx.db.get(roleId);

    if (!role) {
      throw new ConvexError("Role not found");
    }

    const member = await ctx.db.get(serverMemberId);

    if (!member) {
      throw new Error("Member not found");
    }

    const currentMember = await checkMember({
      ctx,
      serverId: member.serverId,
      userId,
    });

    if (!currentMember) {
      throw new ConvexError("User is not a server member");
    }

    const isPermitted = await checkPermission({
      ctx,
      serverMemberId: currentMember?._id,
      permission: "MANAGE_ROLES",
    });

    if (!isPermitted) {
      throw new ConvexError("User is not allowed to change roles");
    }

    await ctx.db.patch(serverMemberId, {
      roleIds: [...member.roleIds, roleId],
    });

    serverMemberId;
  },
});

export const deleteRole = mutation({
  args: {
    serverMemberId: v.id("serverMembers"),
    roleId: v.id("roles"),
  },
  handler: async (ctx, { serverMemberId, roleId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("User Unauthorized");
    }

    const role = await ctx.db.get(roleId);

    if (!role) {
      throw new ConvexError("Role not found");
    }

    const member = await ctx.db.get(serverMemberId);

    if (!member) {
      throw new Error("Member not found");
    }

    const currentMember = await checkMember({
      ctx,
      serverId: member.serverId,
      userId,
    });

    if (!currentMember) {
      throw new ConvexError("User is not a server member");
    }

    const everyoneRole = await ctx.db
      .query("roles")
      .withIndex("byNameAndServerId", (q) =>
        q.eq("name", EVERYONE_ROLE).eq("serverId", member.serverId)
      )
      .unique();

    if (!everyoneRole) {
      throw new ConvexError("Everyone role not found");
    }

    const isEveryoneRole = everyoneRole?._id === roleId;

    if (isEveryoneRole) {
      throw new ConvexError("'Everyone' is not allowed to be deleted");
    }

    const isPermitted = await checkPermission({
      ctx,
      serverMemberId: currentMember?._id,
      permission: "MANAGE_ROLES",
    });

    if (!isPermitted) {
      throw new ConvexError("User is not allowed to change roles");
    }

    const newUserRole = member.roleIds.filter(
      (userRoleId) => userRoleId !== roleId
    );

    await ctx.db.patch(serverMemberId, {
      roleIds: newUserRole,
    });

    serverMemberId;
  },
});

export const addRole = mutation({
  args: {
    name: v.string(),
    permissions: v.array(serverPermissionValidator),
    serverId: v.id("servers"),
  },
  handler: async (ctx, { name, permissions, serverId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized user");
    }

    const serverMember = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!serverMember) {
      throw new ConvexError("User is not a server member");
    }

    const isPermitted = await checkPermission({
      ctx,
      serverMemberId: serverMember._id,
      permission: "MANAGE_ROLES",
    });

    if (!isPermitted) {
      throw new ConvexError("User is not allowed to manage roles");
    }

    if (name == EVERYONE_ROLE) {
      throw new ConvexError("'@everyone' is a default role");
    }

    const roleId = await ctx.db.insert("roles", {
      serverId,
      name,
      permissions,
    });

    return roleId;
  },
});

export const modifyRole = mutation({
  args: {
    roleId: v.id("roles"),
    serverId: v.id("servers"),
    permissions: v.array(serverPermissionValidator),
  },
  handler: async (ctx, { roleId, serverId, permissions }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized user");
    }

    const serverMember = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!serverMember) {
      throw new ConvexError("User is not a server member");
    }

    const isPermitted = await checkPermission({
      ctx,
      serverMemberId: serverMember._id,
      permission: "MANAGE_ROLES",
    });

    if (!isPermitted) {
      throw new ConvexError("User is not allowed to manage roles");
    }

    const role = await ctx.db.get(roleId);

    if (!role) {
      throw new ConvexError("Role not found");
    }

    await ctx.db.patch(roleId, {
      permissions: permissions,
    });

    return roleId;
  },
});

export const getRoles = query({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, { serverId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const serverMember = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!serverMember) {
      return null;
    }

    const roles = await ctx.db
      .query("roles")
      .withIndex("byServerId", (q) => q.eq("serverId", serverId))
      .collect();

    if (!roles) {
      return null;
    }
    return roles;
  },
});

export const getRoleById = query({
  args: {
    roleId: v.id("roles"),
    serverId: v.id("servers"),
  },
  handler: async (ctx, { roleId, serverId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const serverMember = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!serverMember) {
      return null;
    }

    const role = await ctx.db.get(roleId);

    if (!role) return null;

    return role;
  },
});
