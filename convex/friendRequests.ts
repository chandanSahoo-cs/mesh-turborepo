import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createFriendRequest = mutation({
  args: {
    toUserId: v.id("users"),
  },
  handler: async (ctx, { toUserId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const toUser = await ctx.db.get(toUserId);

    if (!toUser) {
      throw new ConvexError("Other user doesn't exist");
    }

    const [userOne, userTwo] = [toUserId, userId].sort();

    const isFriendRequestExists = await ctx.db
      .query("friendRequests")
      .withIndex("byUserOneAndUserTwo", (q) =>
        q.eq("userOne", userOne).eq("userTwo", userTwo)
      )
      .unique();

    if (isFriendRequestExists) {
      throw new ConvexError("Friend request already exists or pending");
    }

    const friendRequestId = await ctx.db.insert("friendRequests", {
      userOne,
      userTwo,
      intiatedBy: userId,
      status: "pending",
    });

    return friendRequestId;
  },
});

export const acceptFriendRequest = mutation({
  args: {
    friendRequestId: v.id("friendRequests"),
  },
  handler: async (ctx, { friendRequestId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const friendRequest = await ctx.db.get(friendRequestId);

    if (!friendRequest) {
      throw new ConvexError("Friend request doesn't exist");
    }

    if (
      friendRequest?.userOne !== userId &&
      friendRequest?.userTwo !== userId
    ) {
      throw new ConvexError("This request doesn't belong to you");
    }

    if (friendRequest.status !== "pending") {
      throw new ConvexError("Friend request is already resolved");
    }

    await ctx.db.patch(friendRequestId, {
      status: "accepted",
    });

    return friendRequestId;
  },
});

export const rejectFriendRequest = mutation({
  args: {
    friendRequestId: v.id("friendRequests"),
  },
  handler: async (ctx, { friendRequestId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const friendRequest = await ctx.db.get(friendRequestId);

    if (!friendRequest) {
      throw new ConvexError("Friend request doesn't exist");
    }

    if (
      friendRequest?.userOne !== userId &&
      friendRequest?.userTwo !== userId
    ) {
      throw new ConvexError("This request doesn't belong to you");
    }

    if (friendRequest.status !== "pending") {
      throw new ConvexError("Friend request is already resolved");
    }

    await ctx.db.delete(friendRequestId);

    return friendRequestId;
  },
});

export const blockFriendRequest = mutation({
  args: {
    friendRequestId: v.id("friendRequests"),
  },
  handler: async (ctx, { friendRequestId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const friendRequest = await ctx.db.get(friendRequestId);

    if (!friendRequest) {
      throw new ConvexError("Friend request doesn't exist");
    }

    if (
      friendRequest?.userOne !== userId &&
      friendRequest?.userTwo !== userId
    ) {
      throw new ConvexError("This request doesn't belong to you");
    }

    if (friendRequest.status !== "pending") {
      throw new ConvexError("Friend request is already resolved");
    }

    await ctx.db.patch(friendRequestId, {
      status: "blocked",
    });

    return friendRequestId;
  },
});

export const getFriendRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized error");
    }

    const [userOneFriendRequests, userTwoFriendRequests] = await Promise.all([
      ctx.db
        .query("friendRequests")
        .withIndex("byUserOne", (q) => q.eq("userOne", userId))
        .collect(),
      ctx.db
        .query("friendRequests")
        .withIndex("byUserTwo", (q) => q.eq("userTwo", userId))
        .collect(),
    ]);

    const friendRequest = [...userOneFriendRequests, ...userTwoFriendRequests];

    return friendRequest;
  },
});

export const getFriendRequestById = query({
  args: {
    friendRequestId: v.id("friendRequests"),
  },
  handler: async (ctx, { friendRequestId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const friendRequest = await ctx.db.get(friendRequestId);

    if (!friendRequest) {
      throw new ConvexError("Friend request doesn't exist");
    }

    if (
      friendRequest?.userOne !== userId &&
      friendRequest?.userTwo !== userId
    ) {
      throw new ConvexError("This request doesn't belong to you");
    }

    return friendRequest;
  },
});
