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
    type: v.union(v.literal("category"), v.literal("text"), v.literal("voice")),
    categoryId: v.optional(v.id("channels")),
  },
  handler: async (ctx, { serverId, name, type, categoryId }) => {
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
      serverMemberId: member._id,
      permission: "MANAGE_CHANNELS",
    });

    if (!isPermitted) {
      throw new ConvexError("User is not allowed to create new channels");
    }

    const parsedName = name.replace(/\s+/g, "-").toLowerCase();

    const newChannelId = await ctx.db.insert("channels", {
      name: parsedName,
      type: type,
      serverId: serverId,
      parentId: categoryId,
    });

    return newChannelId;
  },
});

export const getChannelById = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, { channelId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const channel = await ctx.db.get(channelId);

    console.log("channel:", channel);
    if (!channel) {
      return null;
    }

    const member = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", channel?.serverId)
      )
      .unique();

    if (!member) {
      return null;
    }
    return channel;
  },
});

export const renameChannel = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.string(),
  },
  handler: async (ctx, { channelId, name }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("User unauthorized");
    }

    const channel = await ctx.db.get(channelId);

    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    const member = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", channel?.serverId)
      )
      .unique();

    if (!member) {
      throw new ConvexError("User is not a server member");
    }

    const isPermitted = await checkPermission({
      ctx,
      serverMemberId: member._id,
      permission: "MANAGE_CHANNELS",
    });

    if (!isPermitted) {
      throw new ConvexError("User is not allowed to create new channels");
    }

    const parsedName = name.replace(/\s+/g, "-").toLowerCase();

    await ctx.db.patch(channelId, {
      name: parsedName,
    });

    return channelId;
  },
});

export const removeChannel = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, { channelId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("User unauthorized");
    }

    const channel = await ctx.db.get(channelId);

    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    const member = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", channel?.serverId)
      )
      .unique();

    if (!member) {
      throw new ConvexError("User is not a server member");
    }

    const isPermitted = await checkPermission({
      ctx,
      serverMemberId: member._id,
      permission: "MANAGE_CHANNELS",
    });

    if (!isPermitted) {
      throw new ConvexError("User is not allowed to create new channels");
    }

    const [messages] = await Promise.all([
      ctx.db
        .query("messages")
        .withIndex("byChannelId", (q) => q.eq("channelId", channelId))
        .collect(),
    ]);

    await Promise.all([
      ...messages.map((message) => ctx.db.delete(message._id)),
    ]);

    await ctx.db.delete(channelId);
    return channelId;
  },
});
