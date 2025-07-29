import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { checkMember } from "../src/lib/checkMember";
import { mutation } from "./_generated/server";

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    value: v.string(),
  },
  handler: async (ctx, { messageId, value }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized user");
    }

    const message = await ctx.db.get(messageId);

    if (!message) {
      throw new Error("Message not found");
    }
    const memeber = await checkMember({
      ctx,
      serverId: message.serverId,
      userId,
    });

    if (!memeber) {
      throw new Error("Member not found");
    }

    const existingMessageReactionFromUser = await ctx.db
      .query("reactions")
      .withIndex("byMemberIdAndbyMessageIdAndbyValue", (q) =>
        q
          .eq("serverMemberId", memeber._id)
          .eq("messageId", messageId)
          .eq("value", value)
      )
      .unique();


    if (existingMessageReactionFromUser) {
      await ctx.db.delete(existingMessageReactionFromUser._id);
      return existingMessageReactionFromUser._id;
    }
    const reactionId = await ctx.db.insert("reactions", {
      serverId: message.serverId,
      serverMemberId: memeber._id,
      messageId,
      value,
    });

    return reactionId;
  },
});
