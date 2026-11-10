import { getAuthUserId } from "@convex-dev/auth/server"
import { Doc, Id } from "../../convex/_generated/dataModel"
import { MutationCtx, QueryCtx } from "../../convex/_generated/server"
import { SERVER_PERMISSIONS, ServerPermission } from "../../convex/schema"

type Ctx = MutationCtx | QueryCtx

export const EVERYONE_ROLE = "@everyone";

// Single source of truth for detecting the default role. Older rows may not
// have the `isEveryone` flag, so fall back to the reserved name.
export const isEveryoneRole = (role: Pick<Doc<"roles">, "name" | "isEveryone">) =>
    role.isEveryone === true || role.name === EVERYONE_ROLE;

interface CheckPermissionProps {
    ctx: Ctx
    serverMemberId: Id<"serverMembers">
    permission: ServerPermission
}

// Resolves the full set of permissions a member effectively holds.
// The server owner and ADMINISTRATOR holders get every permission.
export const getMemberPermissions = async (
    ctx: Ctx,
    serverMemberId: Id<"serverMembers">
): Promise<Set<ServerPermission>> => {
    const serverMember = await ctx.db.get(serverMemberId);
    if (!serverMember) return new Set();

    const server = await ctx.db.get(serverMember.serverId);
    if (!server) return new Set();

    if (server.ownerId === serverMember.userId) {
        return new Set(SERVER_PERMISSIONS);
    }

    const roles = await Promise.all(
        serverMember.roleIds.map((roleId) => ctx.db.get(roleId))
    );

    // Ignore dangling ids and roles that somehow belong to another server.
    const permissions = new Set(
        roles
            .filter((r): r is Doc<"roles"> => !!r && r.serverId === serverMember.serverId)
            .flatMap((r) => r.permissions)
    );

    if (permissions.has("ADMINISTRATOR")) {
        return new Set(SERVER_PERMISSIONS);
    }

    return permissions;
}

// Checks whether the given member holds a permission.
// Callers must make sure `serverMemberId` is the caller's own membership.
export const checkPermission = async ({ ctx, serverMemberId, permission }: CheckPermissionProps) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const serverMember = await ctx.db.get(serverMemberId);
    if (!serverMember || serverMember.userId !== userId) return false;

    const permissions = await getMemberPermissions(ctx, serverMemberId);
    return permissions.has(permission);
}
