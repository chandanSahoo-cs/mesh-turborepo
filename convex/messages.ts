import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { checkMember } from "../src/lib/checkMember";
import { checkPermission } from "../src/lib/permissions";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";

type ReactionMap = {
  reaction: Doc<"reactions">;
  count: number;
  members: Id<"serverMembers">[];
};

export type DedupedReaction = {
  value: string;
  count: number;
  memberIds: Id<"serverMembers">[];
  reactionDetails: Doc<"reactions">;
};

const populateUser = (ctx: QueryCtx, userId: Id<"users">) => {
  return ctx.db.get(userId);
};

const populateMember = (ctx: QueryCtx, memberId: Id<"serverMembers">) => {
  return ctx.db.get(memberId);
};

const populateReactions = (ctx: QueryCtx, messageId: Id<"messages">) => {
  return ctx.db
    .query("reactions")
    .withIndex("byMessageId", (q) => q.eq("messageId", messageId))
    .collect();
};

const populateThread = async (ctx: QueryCtx, messageId: Id<"messages">) => {
  const messages = await ctx.db
    .query("messages")
    .withIndex("byParentMessageId", (q) => q.eq("parentMessageId", messageId))
    .collect();

  if (messages.length === 0) {
    return {
      count: 0,
      image: undefined,
      timeStamp: 0,
      name: ""
    };
  }

  const lastMessage = messages[messages.length - 1];
  const lastMessageMember = await populateMember(
    ctx,
    lastMessage.serverMemberId
  );

  if (!lastMessageMember) {
    return {
      count: 0,
      image: undefined,
      timeStamp: 0,
      name: ""
    };
  }

  const lastMessageUser = await populateUser(ctx, lastMessageMember.userId);

  return {
    count: messages.length,
    image: lastMessageUser?.image,
    timeStamp: lastMessage._creationTime,
    name: lastMessageUser?.name
  };
};

export const getMessages = query({
  args: {
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("serverConversations")),
    parentMessageId: v.optional(v.id("messages")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    { channelId, conversationId, parentMessageId, paginationOpts }
  ) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized user");
    }

    let _conversationId = conversationId;

    if (!channelId && !conversationId && parentMessageId) {
      const parentMessage = await ctx.db.get(parentMessageId);
      if (!parentMessage) {
        throw new ConvexError("No link found to the message");
      }
      _conversationId = parentMessage?.conversationId;
    }

    const results = await ctx.db
      .query("messages")
      .withIndex("byChannelIdAndParentMessageIdAndConversationId", (q) =>
        q
          .eq("channelId", channelId)
          .eq("parentMessageId", parentMessageId)
          .eq("conversationId", _conversationId)
      )
      .order("desc")
      .paginate(paginationOpts);

    return {
      ...results,
      page: (
        await Promise.all(
          results.page.map(async (message) => {
            const member = await populateMember(ctx, message.serverMemberId);
            const user = member ? await populateUser(ctx, member.userId) : null;

            if (!member || !user) {
              return null;
            }

            const reactions = await populateReactions(ctx, message._id);
            const thread = await populateThread(ctx, message._id);
            const image = message.image
              ? await ctx.storage.getUrl(message.image)
              : undefined;

            let reactionMap = new Map<string, ReactionMap>();

            for (const reaction of reactions) {
              const entry = reactionMap.get(reaction.value);

              if (entry) {
                entry.count++;
                entry.members.push(reaction.serverMemberId);
              } else {
                reactionMap.set(reaction.value, {
                  reaction: reaction,
                  count: 1,
                  members: [reaction.serverMemberId],
                });
              }
            }

            const dedupedReactions: DedupedReaction[] = [];

            for (const [key, value] of reactionMap) {
              const reaction = {
                reactionDetails: value.reaction,
                value: key,
                count: value.count,
                memberIds: value.members,
              };

              dedupedReactions.push(reaction);
            }

            return {
              ...message,
              image,
              serverMember: member,
              user,
              reactions: dedupedReactions,
              threadCount: thread.count,
              threadImage: thread.image,
              threadTimestamp: thread.timeStamp,
              threadName: thread.name
            };
          })
        )
      ).filter(
        (message): message is NonNullable<typeof message> => message !== null
      ),
    };
  },
});

export const createMessage = mutation({
  args: {
    body: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    serverId: v.id("servers"),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("serverConversations")),
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
    });

    return messageId;
  },
});

export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    body: v.string(),
  },
  handler: async (ctx, { messageId, body }) => {
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

    if (message.serverMemberId !== memeber._id) {
      throw new Error("User is not allowed to edit the message");
    }

    await ctx.db.patch(messageId, {
      body: body,
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
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

    if (message.serverMemberId !== memeber._id) {
      throw new Error("User is not allowed to edit the message");
    }

    const reactions = await ctx.db
      .query("reactions")
      .withIndex("byMessageId", (q) => q.eq("messageId", messageId))
      .collect();

    Promise.all(reactions.map((reaction) => ctx.db.delete(reaction._id)));

    await ctx.db.delete(messageId);

    return messageId;
  },
});

export const getMessageById = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const message = await ctx.db.get(messageId);

    if (!message) {
      return null;
    }
    const currentMemeber = await checkMember({
      ctx,
      serverId: message.serverId,
      userId,
    });

    if (!currentMemeber) {
      return null;
    }

    //member who actually wrote the message
    const member = await populateMember(ctx, message.serverMemberId);

    if (!member) {
      return null;
    }

    const user = await populateUser(ctx, member.userId);

    if (!user) {
      return null;
    }

    const reactions = await populateReactions(ctx, message._id);

    const reactionMap = new Map<string, ReactionMap>();

    for (const reaction of reactions) {
      const entry = reactionMap.get(reaction.value);

      if (entry) {
        entry.count++;
        entry.members.push(reaction.serverMemberId);
      } else {
        reactionMap.set(reaction.value, {
          count: 1,
          reaction: reaction,
          members: [reaction.serverMemberId],
        });
      }
    }

    const dedupedReactions: DedupedReaction[] = [];

    for (const [key, value] of reactionMap) {
      const reaction = {
        reactionDetails: value.reaction,
        value: key,
        count: value.count,
        memberIds: value.members,
      };

      dedupedReactions.push(reaction);
    }

    const messageImage = message.image
      ? await ctx.storage.getUrl(message.image)
      : undefined;

    return {
      ...message,
      image: messageImage,
      user,
      member,
      reactions: dedupedReactions,
    };
  },
});
