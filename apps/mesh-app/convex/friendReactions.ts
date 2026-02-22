import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

/*
- Check for auth user
- Check for message
- Check if that specific reaction exists from that exact user
  - If yes delete it
  - Else create 
*/
export const toggleFriendReaction = mutation({
  args: {
    friendMessageId: v.id("friendMessages"),
    value: v.string(),
  },
  handler: async (ctx, { friendMessageId, value }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized user");
    }

    const message = await ctx.db.get(friendMessageId);

    if (!message) {
      throw new Error("Message not found");
    }

    const existingMessageReactionFromUser = await ctx.db
      .query("friendReactions")
      .withIndex("byUserIdAndbyMessageIdAndbyValue", (q) =>
        q
          .eq("userId", userId)
          .eq("friendMessageId", friendMessageId)
          .eq("value", value)
      )
      .unique();

    if (existingMessageReactionFromUser) {
      await ctx.db.delete(existingMessageReactionFromUser._id);
      return existingMessageReactionFromUser._id;
    }
    const reactionId = await ctx.db.insert("friendReactions", {
      userId,
      friendMessageId,
      value,
    });

    return reactionId;
  },
});
