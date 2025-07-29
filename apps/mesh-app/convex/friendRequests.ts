import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export type friendUserRequestsType = Doc<"friendRequests"> & {
  friendUserInfo: Doc<"users"> | null;
};

export type FriendRequestInfoType =
  | {
      incomingRequests: Array<friendUserRequestsType>;
      outgoingRequests: Array<friendUserRequestsType>;
      acceptedFriendRequest: Array<friendUserRequestsType>;
      blockedFriendRequest: Array<friendUserRequestsType>;
    }
  | undefined;

export const createFriendRequest = mutation({
  args: {
    toUserEmail: v.string(),
  },
  handler: async (ctx, { toUserEmail }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const toUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", toUserEmail))
      .unique();

    if (!toUser) {
      throw new ConvexError("Other user doesn't exist");
    }

    const [userOne, userTwo] = [toUser._id, userId].sort();

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
      initiatedBy: userId,
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

    if (
      friendRequest.status !== "pending" &&
      friendRequest.status !== "accepted"
    ) {
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

    await ctx.db.patch(friendRequestId, {
      status: "blocked",
    });

    return friendRequestId;
  },
});

export const unblockFriendRequest = mutation({
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

    if (friendRequest.status !== "blocked") {
      throw new ConvexError("Friend request is already resolved");
    }

    await ctx.db.delete(friendRequestId);

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

    const friendRequests = [...userOneFriendRequests, ...userTwoFriendRequests];

    const incomingRequests = [];
    const outgoingRequests = [];
    const acceptedFriendRequest = [];
    const blockedFriendRequest = [];

    for (const request of friendRequests) {
      const { status, initiatedBy, userOne, userTwo } = request;

      const otherUserId = userOne === userId ? userTwo : userOne;

      if (status === "pending") {
        if (initiatedBy === userId) {
          outgoingRequests.push({
            ...request,
            friendUserInfo: ctx.db.get(otherUserId),
          });
        } else {
          incomingRequests.push({
            ...request,
            friendUserInfo: ctx.db.get(initiatedBy),
          });
        }
      } else if (status === "accepted") {
        acceptedFriendRequest.push({
          ...request,
          friendUserInfo: ctx.db.get(otherUserId),
        });
      } else if (status === "blocked") {
        blockedFriendRequest.push({
          ...request,
          friendUserInfo: ctx.db.get(otherUserId),
        });
      }
    }

    const friendRequestInfo = {
      incomingRequests: await Promise.all(
        incomingRequests.map(async (r) => ({
          ...r,
          friendUserInfo: await r.friendUserInfo,
        }))
      ),
      outgoingRequests: await Promise.all(
        outgoingRequests.map(async (r) => ({
          ...r,
          friendUserInfo: await r.friendUserInfo,
        }))
      ),
      acceptedFriendRequest: await Promise.all(
        acceptedFriendRequest.map(async (r) => ({
          ...r,
          friendUserInfo: await r.friendUserInfo,
        }))
      ),
      blockedFriendRequest: await Promise.all(
        blockedFriendRequest.map(async (r) => ({
          ...r,
          friendUserInfo: await r.friendUserInfo,
        }))
      ),
    };

    return friendRequestInfo;
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
