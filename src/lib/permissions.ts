import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "../../convex/_generated/dataModel"
import { MutationCtx, QueryCtx } from "../../convex/_generated/server"
import { ServerPermission } from "../../convex/schema"

interface CheckPermissionProps {
    ctx: MutationCtx | QueryCtx
    memberId: Id<"serverMembers">
    permission: ServerPermission
}

export const checkPermission = async({ctx,memberId,permission}:CheckPermissionProps) =>{

    const userId = await getAuthUserId(ctx);

    const serverMember = await ctx.db.get(memberId);
    if(!serverMember) return false;

    const server = await ctx.db.get(serverMember?.serverId);

      if (server?.ownerId === userId) {
        return true;
      }

    const roles = await Promise.all(
        serverMember.roleIds.map((roleId)=>ctx.db.get(roleId))
    );


    const userPermissions = roles.flatMap((r)=>r?.permissions ?? []);

    return (
        userPermissions.includes("ADMINISTRATOR") || 
        userPermissions.includes(permission) 
    )
}