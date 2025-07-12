import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getCurrentMember = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, { serverId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const member = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!member) {
      return null;
    }

    return member;
  },
});
