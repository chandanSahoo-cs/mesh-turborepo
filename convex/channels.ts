import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { checkPermission } from "../src/lib/permissions";
import { mutation, query } from "./_generated/server";

export const getChannels = query({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, { serverId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    const member = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!member) {
      return [];
    }

    const channels = await ctx.db
      .query("channels")
      .withIndex("byServerId", (q) => q.eq("serverId", serverId))
      .collect();

    return channels;
  },
});

export const createChannel = mutation({
  args: {
    serverId: v.id("servers"),
    name: v.string(),
  },
  handler: async (ctx, { serverId, name }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("User unauthorized");
    }

    const member = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!member) {
      throw new ConvexError("User is not a server member");
    }

    const isPermitted = await checkPermission({
      ctx,
      memberId: member._id,
      permission: "MANAGE_CHANNELS",
    });

    if (!isPermitted) {
      throw new ConvexError("User is not allowed to create new channels");
    }

    const parsedName = name.replace(/\s+/g, "-").toLowerCase();

    const newChannelId = await ctx.db.insert("channels", {
      name: parsedName,
      type: "text",
      serverId: serverId,
    });

    return newChannelId;
  },
});
