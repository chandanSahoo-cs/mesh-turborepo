import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";

const populateUser = (ctx: QueryCtx, userId: Id<"users">) => {
  return ctx.db.get(userId);
};

const populateThread = async (
  ctx: QueryCtx,
  friendMessageId: Id<"friendMessages">
) => {
  const friendMessages = await ctx.db
    .query("friendMessages")
    .withIndex("byParentMessageId", (q) => q.eq("parentMessageId", friendMessageId))
    .collect();

  if (friendMessages.length === 0) {
    return {
      count: 0,
      image: undefined,
      timeStamp: 0,
      name: "",
    };
  }

  const lastMessage = friendMessages[friendMessages.length - 1];

  const lastMessageUser = await populateUser(ctx, lastMessage.userId);

  return {
    count: friendMessages.length,
    image: lastMessageUser?.image,
    timeStamp: lastMessage._creationTime,
    name: lastMessageUser?.name,
  };
};

const populateReactions = (ctx: QueryCtx, friendMessageId: Id<"friendMessages">) => {
  return ctx.db
    .query("friendReactions")
    .withIndex("byMessageId", (q) => q.eq("friendMessageId", friendMessageId))
    .collect();
};

export const getFriendMessages = query({
  args: {
    friendConversationId: v.optional(v.id("friendConversations")),
    parentMessageId: v.optional(v.id("friendMessages")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { friendConversationId, parentMessageId, paginationOpts }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized user");
    }

    let _friendConversationId = friendConversationId;

    if (!friendConversationId && parentMessageId) {
      const parentMessage = await ctx.db.get(parentMessageId);
      if (!parentMessage) {
        throw new ConvexError("No link found to the message");
      }
      _friendConversationId = parentMessage?.friendConversationId;
    }

    const results = await ctx.db
      .query("friendMessages")
      .withIndex("byParentMessageIdAndConversationId", (q) =>
        q
          .eq("parentMessageId", parentMessageId)
          .eq("friendConversationId", _friendConversationId)
      )
      .order("desc")
      .paginate(paginationOpts);

    return {
      ...results,
      page: (
        await Promise.all(
          results.page.map(async (message) => {
            const user = await populateUser(ctx, message.userId);

            if (!user) {
              return null;
            }

            const friendReactions = await populateReactions(ctx, message._id);
            const thread = await populateThread(ctx, message._id);
            const image = message.image
              ? await ctx.storage.getUrl(message.image)
              : undefined;

            return {
              ...message,
              image,
              user,
              friendReactions: friendReactions,
              threadCount: thread.count,
              threadImage: thread.image,
              threadTimestamp: thread.timeStamp,
              threadName: thread.name,
            };
          })
        )
      ).filter(
        (message): message is NonNullable<typeof message> => message !== null
      ),
    };
  },
});

export const createFriendMessage = mutation({
  args: {
    body: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    friendConversationId: v.optional(v.id("friendConversations")),
    parentMessageId: v.optional(v.id("friendMessages")),
  },
  handler: async (ctx, { body, image, parentMessageId, friendConversationId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Unauthorized user");
    }

    if (!image && !body) {
      throw new ConvexError("Message is empty");
    }

    let _friendConversationId = friendConversationId;

    if (!friendConversationId && parentMessageId) {
      const parentMessage = await ctx.db.get(parentMessageId);

      if (!parentMessage) {
        throw new ConvexError("No link to the message exists");
      }
      _friendConversationId = parentMessage.friendConversationId;
    }

    const friendMessageId = await ctx.db.insert("friendMessages", {
      image,
      body,
      parentMessageId,
      friendConversationId: _friendConversationId,
      userId: userId,
    });

    return friendMessageId;
  },
});

export const updateFriendMessage = mutation({
  args: {
    friendMessageId: v.id("friendMessages"),
    body: v.string(),
  },
  handler: async (ctx, { friendMessageId, body }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized user");
    }

    const message = await ctx.db.get(friendMessageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.userId !== userId) {
      throw new ConvexError("This message doesn't belong to you");
    }

    await ctx.db.patch(friendMessageId, {
      body: body,
      updatedAt: Date.now(),
    });

    return friendMessageId;
  },
});

export const deleteFriendMessage = mutation({
  args: {
    friendMessageId: v.id("friendMessages"),
  },
  handler: async (ctx, { friendMessageId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized user");
    }

    const message = await ctx.db.get(friendMessageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.userId !== userId) {
      throw new ConvexError("This message doesn't belong to you");
    }

    const friendReactions = await ctx.db
      .query("friendReactions")
      .withIndex("byMessageId", (q) => q.eq("friendMessageId", friendMessageId))
      .collect();

    Promise.all(friendReactions.map((reaction) => ctx.db.delete(reaction._id)));

    await ctx.db.delete(friendMessageId);

    return friendMessageId;
  },
});

export const getFriendMessageById = query({
  args: {
    friendMessageId: v.id("friendMessages"),
  },
  handler: async (ctx, { friendMessageId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const message = await ctx.db.get(friendMessageId);

    if (!message) {
      return null;
    }

    //member who actually wrote the message

    const user = await populateUser(ctx, message.userId);

    if (!user) {
      return null;
    }

    const friendReactions = await populateReactions(ctx, message._id);

    const messageImage = message.image
      ? await ctx.storage.getUrl(message.image)
      : undefined;

    return {
      ...message,
      image: messageImage,
      user,
      friendReactions,
    };
  },
});
