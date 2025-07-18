import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { checkMember } from "../src/lib/checkMember";
import { checkPermission } from "../src/lib/permissions";
import { mutation, query } from "./_generated/server";

export const getCurrentMember = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, { serverId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const member = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!member) {
      return null;
    }

    return member;
  },
});

export const getMembers = query({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, { serverId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    const memeber = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (!memeber) {
      return [];
    }

    const serverMembers = await ctx.db
      .query("serverMembers")
      .withIndex("byServerId", (q) => q.eq("serverId", serverId))
      .collect();

    if (!serverMembers) {
      return [];
    }

    const serverMemberInfo = (
      await Promise.all(
        serverMembers.map(async (serverMember) => {
          const memberInfo = await ctx.db.get(serverMember.userId);
          return { ...serverMember, memberInfo };
        })
      )
    ).filter(Boolean);

    return serverMemberInfo;
  },
});

export const getMemberById = query({
  args: {
    serverMemberId: v.id("serverMembers"),
  },
  handler: async (ctx, { serverMemberId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const serverMember = await ctx.db.get(serverMemberId);

    if (!serverMember) {
      return null;
    }
    const user = await ctx.db.get(serverMember?.userId);

    const currentMember = await checkMember({
      ctx,
      serverId: serverMember?.serverId,
      userId,
    });

    if (!currentMember) {
      return null;
    }

    return {
      ...serverMember,
      user,
    };
  },
});

export const removeMember = mutation({
  args: {
    serverMemberId: v.id("serverMembers"),
  },
  handler: async (ctx, { serverMemberId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("User Unauthorized");
    }

    const member = await ctx.db.get(serverMemberId);

    if (!member) {
      throw new Error("Member not found");
    }

    const currentMember = await checkMember({
      ctx,
      serverId: member.serverId,
      userId,
    });

    if (!currentMember) {
      throw new ConvexError("User is not a server member");
    }

    const server = await ctx.db.get(currentMember.serverId);

    if (member.userId === server?.ownerId) {
      throw new ConvexError("Transfer ownership before leaving the server");
    }

    const isPermitted =
      (await checkPermission({
        ctx,
        serverMemberId: currentMember?._id,
        permission: "MANAGE_MEMBERS",
      })) || currentMember._id !== member._id;

    //messages, reactions

    if (!isPermitted) {
      throw new ConvexError("You're not allowed to remove server members");
    }

    const [
      deletedMemberMessages,
      deletedMemberReactions,
      deletedMemberServerConversation1,
      deletedMemberServerConversation2,
    ] = await Promise.all([
      ctx.db
        .query("messages")
        .withIndex("byServerMemberId", (q) =>
          q.eq("serverMemberId", member._id)
        )
        .collect(),
      ctx.db
        .query("reactions")
        .withIndex("byServerMemberId", (q) =>
          q.eq("serverMemberId", member._id)
        )
        .collect(),

      ctx.db
        .query("serverConversations")
        .withIndex("byMember1", (q) => q.eq("member1Id", member._id))
        .collect(),
      ctx.db
        .query("serverConversations")
        .withIndex("byMember2", (q) => q.eq("member2Id", member._id))
        .collect(),
    ]);

    const deletedMemberServerConversation = [
      ...deletedMemberServerConversation1,
      ...deletedMemberServerConversation2,
    ];

    await Promise.allSettled([
      ...deletedMemberMessages.map(async (message) => {
        await ctx.db.delete(message._id);
        if (message.image) await ctx.storage.delete(message.image);
      }),
      ...deletedMemberReactions.map((reaction) => ctx.db.delete(reaction._id)),
      ...deletedMemberServerConversation.map((serverConversation) =>
        ctx.db.delete(serverConversation._id)
      ),
    ]);

    await ctx.db.delete(serverMemberId);
    return serverMemberId;
  },
});
