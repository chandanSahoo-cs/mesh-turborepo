import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

export const createOrGetFriendConversation = mutation({
  args: {
    userId: v.id("users"), // person with whom the user to want to have a conversation
  },
  handler: async (ctx, { userId}) => {
    const currentUserId = await getAuthUserId(ctx);

    if (!currentUserId) {
      throw new ConvexError("Unauthorized User");
    }

    const currentUser = await ctx.db.get(currentUserId);

    const otherUser = await ctx.db.get(userId);

    if (!currentUser || !otherUser) {
      throw new ConvexError("User not found");
    }

    const [user1, user2] =
      currentUser._id < otherUser._id
        ? [currentUser, otherUser]
        : [otherUser, currentUser];

    const existingConversation = await ctx.db
      .query("friendConversations")
      .withIndex("byUser1AndByUser2", (q) =>
        q.eq("user1Id", user1._id).eq("user2Id", user2._id)
      )
      .unique();

    if (existingConversation) {
      return existingConversation;
    }

    const conversationId = await ctx.db.insert("friendConversations", {
      user1Id: user1._id,
      user2Id: user2._id,
    });

    const newConverstaion = await ctx.db.get(conversationId);

    if (!newConverstaion) {
      throw new ConvexError("Conversation not found");
    }

    return newConverstaion;
  },
});
