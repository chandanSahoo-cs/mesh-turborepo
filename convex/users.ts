import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new ConvexError("User is not authenticated!");
      }

      return await ctx.db.get(userId);
    } catch (error) {
      console.error(error);
    }
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
