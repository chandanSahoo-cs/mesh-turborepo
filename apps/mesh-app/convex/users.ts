import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.get(userId);
  },
});

export const userDetailsById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const currentUserId = await getAuthUserId(ctx);

    if (!currentUserId) {
      throw new ConvexError("User unauthorized");
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new ConvexError("User not found");
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      lastSeen: user.lastSeen,
      manualStatus: user.manualStatus,
      effectiveStatus: user.effectiveStatus,
      isAnonymous: user.isAnonymous,
      _creationTime: user._creationTime,
    };
  },
});

export const updateManualStatus = mutation({
  args: {
    status: v.union(
      v.literal("online"),
      v.literal("idle"),
      v.literal("dnd"),
      v.literal("offline")
    ),
  },
  handler: async (ctx, { status }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    await ctx.db.patch(userId, {
      lastSeen: Date.now(),
      manualStatus: status,
      effectiveStatus: status,
    });

    return userId;
  },
});

export const updateEffectiveStatus = mutation({
  args: {
    userId: v.id("users"),

    status: v.union(
      v.literal("online"),
      v.literal("idle"),
      v.literal("dnd"),
      v.literal("offline")
    ),
  },
  handler: async (ctx, { status, userId }) => {
    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(userId, {
      lastSeen: Date.now(),
      effectiveStatus:
        status === "offline" ? status : user.manualStatus || "online",
    });

    return userId;
  },
});
