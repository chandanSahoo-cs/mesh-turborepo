import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { checkMember } from "../src/lib/checkMember";
import { mutation } from "./_generated/server";

export const createOrGetConversation = mutation({
  args: {
    memberId: v.id("serverMembers"), // person with whom the user to want to have a conversation
    serverId: v.id("servers"),
  },
  handler: async (ctx, { memberId, serverId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const currentMember = await checkMember({ ctx, serverId, userId });

    const otherMember = await ctx.db.get(memberId);

    if (!currentMember || !otherMember) {
      throw new ConvexError("Member not found");
    }

    const [member1, member2] =
      currentMember._id < otherMember._id
        ? [currentMember, otherMember]
        : [otherMember, currentMember];

    const existingConversation = await ctx.db
      .query("serverConversations")
      .withIndex("byUser1AndByUser2AndByServerId", (q) =>
        q
          .eq("member1Id", member1._id)
          .eq("member2Id", member2._id)
          .eq("serverId", serverId)
      )
      .unique();

    if (existingConversation) {
      return existingConversation;
    }

    const conversationId = await ctx.db.insert("serverConversations", {
      member1Id: member1._id,
      member2Id: member2._id,
      serverId: serverId,
    });

    const newConverstaion = await ctx.db.get(conversationId);

    if (!newConverstaion) {
      throw new ConvexError("Conversation not found");
    }

    return newConverstaion;
  },
});
