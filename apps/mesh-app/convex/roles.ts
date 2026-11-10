import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { checkMember } from "../src/lib/checkMember";
import {
  EVERYONE_ROLE,
  getMemberPermissions,
  isEveryoneRole,
} from "../src/lib/permissions";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query } from "./_generated/server";
import { ServerPermission, serverPermissionValidator } from "./schema";

/*
- Resolve the caller's membership in the server
- Resolve the caller's effective permissions
- Require MANAGE_ROLES
*/
const requireRoleManager = async (
  ctx: MutationCtx,
  serverId: Id<"servers">,
) => {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new ConvexError("Unauthorized user");
  }

  const actor = await checkMember({ ctx, serverId, userId });

  if (!actor) {
    throw new ConvexError("User is not a server member");
  }

  const actorPermissions = await getMemberPermissions(ctx, actor._id);

  if (!actorPermissions.has("MANAGE_ROLES")) {
    throw new ConvexError("User is not allowed to manage roles");
  }

  return { actor, actorPermissions };
};

// Prevents privilege escalation: you can only grant, edit or hand out
// permissions you already hold yourself.
const assertCanGrant = (
  actorPermissions: Set<ServerPermission>,
  permissions: readonly ServerPermission[],
) => {
  const missing = permissions.filter((p) => !actorPermissions.has(p));

  if (missing.length > 0) {
    throw new ConvexError(
      `You can't grant permissions you don't have: ${missing.join(", ")}`,
    );
  }
};

const getRoleInServer = async (
  ctx: MutationCtx,
  roleId: Id<"roles">,
  serverId: Id<"servers">,
): Promise<Doc<"roles">> => {
  const role = await ctx.db.get(roleId);

  if (!role || role.serverId !== serverId) {
    throw new ConvexError("Role not found");
  }

  return role;
};

const normalizeRoleName = (name: string) => {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new ConvexError("Role name can't be empty");
  }

  if (trimmed === EVERYONE_ROLE) {
    throw new ConvexError("'@everyone' is a default role");
  }

  return trimmed;
};

export const hasPermission = query({
  args: {
    serverMemberId: v.id("serverMembers"),
    permission: serverPermissionValidator,
  },
  handler: async (ctx, { serverMemberId, permission }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return false;
    }

    // Only answer for the caller's own membership, so this can't be used
    // to probe other members' permissions.
    const member = await ctx.db.get(serverMemberId);

    if (!member || member.userId !== userId) {
      return false;
    }

    const permissions = await getMemberPermissions(ctx, serverMemberId);
    return permissions.has(permission);
  },
});

export const assignRoleToMember = mutation({
  args: {
    serverMemberId: v.id("serverMembers"),
    roleId: v.id("roles"),
  },
  handler: async (ctx, { serverMemberId, roleId }) => {
    const member = await ctx.db.get(serverMemberId);

    if (!member) {
      throw new ConvexError("Member not found");
    }

    const { actorPermissions } = await requireRoleManager(ctx, member.serverId);

    const role = await getRoleInServer(ctx, roleId, member.serverId);

    if (isEveryoneRole(role)) {
      throw new ConvexError("'@everyone' is assigned to every member");
    }

    assertCanGrant(actorPermissions, role.permissions);

    if (member.roleIds.includes(roleId)) {
      return serverMemberId;
    }

    await ctx.db.patch(serverMemberId, {
      roleIds: [...member.roleIds, roleId],
    });

    return serverMemberId;
  },
});

export const removeRoleFromMember = mutation({
  args: {
    serverMemberId: v.id("serverMembers"),
    roleId: v.id("roles"),
  },
  handler: async (ctx, { serverMemberId, roleId }) => {
    const member = await ctx.db.get(serverMemberId);

    if (!member) {
      throw new ConvexError("Member not found");
    }

    const { actorPermissions } = await requireRoleManager(ctx, member.serverId);

    const role = await getRoleInServer(ctx, roleId, member.serverId);

    if (isEveryoneRole(role)) {
      throw new ConvexError("'@everyone' can't be removed from a member");
    }

    // Removing a role you couldn't have granted (e.g. stripping an admin)
    // is just as much an escalation as granting it.
    assertCanGrant(actorPermissions, role.permissions);

    await ctx.db.patch(serverMemberId, {
      roleIds: member.roleIds.filter((id) => id !== roleId),
    });

    return serverMemberId;
  },
});

export const addRole = mutation({
  args: {
    name: v.string(),
    permissions: v.array(serverPermissionValidator),
    serverId: v.id("servers"),
  },
  handler: async (ctx, { name, permissions, serverId }) => {
    const { actorPermissions } = await requireRoleManager(ctx, serverId);

    const roleName = normalizeRoleName(name);
    assertCanGrant(actorPermissions, permissions);

    const roleId = await ctx.db.insert("roles", {
      serverId,
      name: roleName,
      permissions: [...new Set(permissions)],
      isEveryone: false,
    });

    return roleId;
  },
});

export const removeRole = mutation({
  args: {
    serverId: v.id("servers"),
    roleId: v.id("roles"),
  },
  handler: async (ctx, { serverId, roleId }) => {
    const { actorPermissions } = await requireRoleManager(ctx, serverId);

    const role = await getRoleInServer(ctx, roleId, serverId);

    if (isEveryoneRole(role)) {
      throw new ConvexError("Everyone role can't be deleted");
    }

    assertCanGrant(actorPermissions, role.permissions);

    // Strip the role from every member so no dangling ids are left behind.
    const members = await ctx.db
      .query("serverMembers")
      .withIndex("byServerId", (q) => q.eq("serverId", serverId))
      .collect();

    await Promise.all(
      members
        .filter((m) => m.roleIds.includes(roleId))
        .map((m) =>
          ctx.db.patch(m._id, {
            roleIds: m.roleIds.filter((id) => id !== roleId),
          }),
        ),
    );

    await ctx.db.delete(roleId);

    return roleId;
  },
});

export const modifyRole = mutation({
  args: {
    roleId: v.id("roles"),
    serverId: v.id("servers"),
    permissions: v.array(serverPermissionValidator),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { roleId, serverId, permissions, name }) => {
    const { actorPermissions } = await requireRoleManager(ctx, serverId);

    const role = await getRoleInServer(ctx, roleId, serverId);

    // Must be able to grant both what the role had and what it will have.
    assertCanGrant(actorPermissions, role.permissions);
    assertCanGrant(actorPermissions, permissions);

    const everyone = isEveryoneRole(role);

    if (everyone && permissions.includes("ADMINISTRATOR")) {
      throw new ConvexError("'@everyone' can't be given ADMINISTRATOR");
    }

    const patch: Partial<Doc<"roles">> = {
      permissions: [...new Set(permissions)],
    };

    if (name !== undefined && name.trim() !== role.name) {
      if (everyone) {
        throw new ConvexError("'@everyone' can't be renamed");
      }
      patch.name = normalizeRoleName(name);
    }

    await ctx.db.patch(roleId, patch);

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

    const serverMember = await checkMember({ ctx, serverId, userId });

    if (!serverMember) {
      return null;
    }

    return ctx.db
      .query("roles")
      .withIndex("byServerId", (q) => q.eq("serverId", serverId))
      .collect();
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

    const serverMember = await checkMember({ ctx, serverId, userId });

    if (!serverMember) {
      return null;
    }

    const role = await ctx.db.get(roleId);

    if (!role || role.serverId !== serverId) return null;

    return role;
  },
});

export const getRoleByMemberId = query({
  args: {
    serverMemberId: v.id("serverMembers"),
  },
  handler: async (ctx, { serverMemberId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const serverMember = await ctx.db.get(serverMemberId);

    if (!serverMember) {
      return null;
    }

    // Caller must share the server with the member they're looking up.
    const caller = await checkMember({
      ctx,
      serverId: serverMember.serverId,
      userId,
    });

    if (!caller) {
      return null;
    }

    const roles = await Promise.all(
      serverMember.roleIds.map((roleId) => ctx.db.get(roleId)),
    );

    return roles.filter(
      (role): role is Doc<"roles"> =>
        !!role && role.serverId === serverMember.serverId,
    );
  },
});
