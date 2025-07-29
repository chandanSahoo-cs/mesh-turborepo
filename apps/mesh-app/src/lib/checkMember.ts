import { Id } from "../../convex/_generated/dataModel";
import { MutationCtx, QueryCtx } from "../../convex/_generated/server";

interface CheckMemberProps {
  ctx: QueryCtx | MutationCtx;
  serverId: Id<"servers">;
  userId: Id<"users">;
}
export const checkMember = async ({
  ctx,
  serverId,
  userId,
}: CheckMemberProps) => {
  return ctx.db
    .query("serverMembers")
    .withIndex("uniqueMembership", (q) =>
      q.eq("userId", userId).eq("serverId", serverId)
    )
    .unique();
};
