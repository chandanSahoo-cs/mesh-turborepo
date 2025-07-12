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

export const getMembers = query({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, { serverId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    const memeber = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!memeber) {
      return [];
    }

    const serverMembers = await ctx.db
      .query("serverMembers")
      .withIndex("byServerId", (q) => q.eq("serverId", serverId))
      .collect();

    if (!serverMembers) {
      return [];
    }

    const serverMemberInfo = (
      await Promise.all(
        serverMembers.map(async (serverMember) => {
          const memberInfo = await ctx.db.get(serverMember.userId);
          return { ...serverMember, memberInfo };
        })
      )
    ).filter(Boolean);

    return serverMemberInfo;
  },
});
