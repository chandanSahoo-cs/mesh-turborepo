import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { checkMember } from "../src/lib/checkMember";
import { checkPermission } from "../src/lib/permissions";
import { mutation } from "./_generated/server";

export const createMessage = mutation({
  args: {
    body: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    serverId: v.id("servers"),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    parentMessageId: v.optional(v.id("messages")),
  },
  handler: async (
    ctx,
    { body, image, serverId, channelId, parentMessageId, conversationId }
  ) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Unauthorized user");
    }

    const member = await checkMember({ ctx, serverId, userId });

    if (!member) {
      throw new Error("User is not a server member");
    }

    if (!image && !body) {
      throw new ConvexError("Message is empty");
    }

    const isPermitted =
      (await checkPermission({
        ctx,
        memberId: member._id,
        permission: "SEND_MESSAGES",
      })) && !member.isMuted;

    if (!isPermitted) {
      throw new Error("User is not permitted to message");
    }

    let _conversationId = conversationId;

    if (!conversationId && !channelId && parentMessageId) {
      const parentMessage = await ctx.db.get(parentMessageId);

      if (!parentMessage) {
        throw new ConvexError("No link to the message exists");
      }
      _conversationId = parentMessage.conversationId;
    }

    const messageId = await ctx.db.insert("messages", {
      image,
      body,
      parentMessageId,
      serverId,
      conversationId: _conversationId,
      serverMemberId: member._id,
      channelId,
      updatedAt: Date.now(),
    });

    return messageId;
  },
});
