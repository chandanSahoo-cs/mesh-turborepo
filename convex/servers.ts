import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { checkPermission } from "../src/lib/permissions";
import { mutation, query } from "./_generated/server";

const generateCode = () => {
  const code = Array.from(
    { length: 6 },
    () => "0123456789abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 36)]
  ).join("");
  return code;
};

export const createServer = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new ConvexError("Unauthorized");
      }

      const joinCode = generateCode();

      const serverId = await ctx.db.insert("servers", {
        name: name,
        ownerId: userId,
        joinCode,
      });

      if (!serverId) {
        throw new ConvexError("Failed to create server");
      }

      const everyoneRoleId = await ctx.db.insert("roles", {
        serverId,
        name: "@everyone",
        permissions: ["VIEW_CHANNELS", "SEND_MESSAGES", "CONNECT_VOICE"],
        isEveryone: true,
      });

      const textChannels = await ctx.db.insert("channels", {
        serverId,
        name: "Text Channels",
        type: "category",
      });

      await ctx.db.insert("channels", {
        serverId,
        name: "general",
        type: "text",
        parentId: textChannels,
      });

      await ctx.db.insert("serverMembers", {
        serverId,
        userId,
        roleIds: [everyoneRoleId],
        isMuted: false,
      });

      if (!everyoneRoleId) {
        throw new ConvexError("Failed to create '@everyone' role");
      }

      return serverId;
    } catch (error) {
      console.log(error);
    }
  },
});

export const getServers = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getAuthUserId(ctx);

      if (!userId) {
        throw new ConvexError("Unauthorized User");
      }
      const membership = await ctx.db
        .query("serverMembers")
        .withIndex("byUserId", (q) => q.eq("userId", userId))
        .collect();

      const memberServerId = membership.map((m) => m.serverId);

      const memberServer = await Promise.all(
        memberServerId.map((id) => ctx.db.get(id))
      );

      return memberServer;
    } catch (error) {
      console.log(error);
    }
  },
});

export const getServerById = query({
  args: { id: v.id("servers") },
  handler: async (ctx, { id }) => {
    try {
      const userId = await getAuthUserId(ctx);

      if (!userId) {
        throw new ConvexError("Unauthorized user");
      }

      const server = await ctx.db.get(id);
      if (!server) {
        throw new ConvexError("Server not found");
      }

      const isOwner = userId === server.ownerId;
      let isMember = false;
      if (!isOwner) {
        const memeber = await ctx.db
          .query("serverMembers")
          .withIndex("uniqueMembership", (q) =>
            q.eq("userId", userId).eq("serverId", server._id)
          )
          .unique();

        isMember = !!memeber;
      }

      if (!isMember && !isOwner) {
        return null;
      }

      return server;
    } catch (error) {
      console.log(error);
    }
  },
});

export const renameServer = mutation({
  args: {
    serverId: v.id("servers"),
    name: v.string(),
  },
  handler: async (ctx, { serverId, name }) => {
    try {
      const userId = await getAuthUserId(ctx);

      if (!userId) {
        throw new ConvexError("Unauthorized user");
      }

      const member = await ctx.db
        .query("serverMembers")
        .withIndex("uniqueMembership", (q) =>
          q.eq("userId", userId).eq("serverId", serverId)
        )
        .unique();

      if (!member) {
        throw new ConvexError("User is not a server member");
      }

      const isPermitted = await checkPermission({
        ctx,
        serverMemberId: member._id,
        permission: "MANAGE_SERVER",
      });

      if (!isPermitted) {
        throw new ConvexError("User is not permitted to rename the server");
      }

      await ctx.db.patch(serverId, {
        name: name,
      });

      return serverId;
    } catch (error) {
      console.error(error);
    }
  },
});

export const deleteServer = mutation({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, { serverId }) => {
    try {
      const userId = await getAuthUserId(ctx);

      if (!userId) {
        throw new ConvexError("Unauthorized user");
      }

      const server = await ctx.db.get(serverId);

      if (!server) {
        throw new ConvexError("Server not found");
      }

      if (server.ownerId !== userId) {
        throw new ConvexError("User is not permitted to delee the server");
      }

      const [serverMembers, roles, channels, messages, conversations] =
        await Promise.all([
          ctx.db
            .query("serverMembers")
            .withIndex("byServerId", (q) => q.eq("serverId", serverId))
            .collect(),
          ctx.db
            .query("roles")
            .withIndex("byServerId", (q) => q.eq("serverId", serverId))
            .collect(),
          ctx.db
            .query("channels")
            .withIndex("byServerId", (q) => q.eq("serverId", serverId))
            .collect(),
          ctx.db
            .query("messages")
            .withIndex("byServerId", (q) => q.eq("serverId", serverId))
            .collect(),
          ctx.db
            .query("serverConversations")
            .withIndex("byServerId", (q) => q.eq("serverId", serverId))
            .collect(),
        ]);

      await Promise.all([
        ...serverMembers.map((serverMember) => ctx.db.delete(serverMember._id)),
        ...roles.map((role) => ctx.db.delete(role._id)),
        ...channels.map((channel) => ctx.db.delete(channel._id)),
        ...messages.map((message) => ctx.db.delete(message._id)),
        ...conversations.map((conversation) => ctx.db.delete(conversation._id)),
      ]);

      await ctx.db.delete(serverId);

      return serverId;
    } catch (error) {
      console.error(error);
    }
  },
});

export const generateNewJoinCode = mutation({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, { serverId }) => {
    try {
      const userId = await getAuthUserId(ctx);

      if (!userId) {
        throw new ConvexError("Unauthorized user");
      }

      const member = await ctx.db
        .query("serverMembers")
        .withIndex("uniqueMembership", (q) =>
          q.eq("userId", userId).eq("serverId", serverId)
        )
        .unique();

      if (!member) {
        throw new ConvexError("User is not a server member");
      }

      const isPermitted = checkPermission({
        ctx,
        serverMemberId: member._id,
        permission: "ADMINISTRATOR",
      });

      if (!isPermitted) {
        throw new ConvexError("User is not allowed to change invite code");
      }

      const newJoinCode = generateCode();

      await ctx.db.patch(serverId, {
        joinCode: newJoinCode,
      });

      return serverId;
    } catch (error) {
      console.error(error);
    }
  },
});

export const joinServer = mutation({
  args: {
    joinCode: v.string(),
    serverId: v.id("servers"),
  },
  handler: async (ctx, { joinCode, serverId }) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("Unauthorized User");
    }

    const server = await ctx.db.get(serverId);

    if (!server) {
      throw new Error("Server not found");
    }

    if (server.joinCode !== joinCode.toLowerCase()) {
      throw new Error("Invalid join code");
    }

    const existingMember = await ctx.db
      .query("serverMembers")
      .withIndex("uniqueMembership", (q) =>
        q.eq("userId", userId).eq("serverId", serverId)
      )
      .unique();

    if (existingMember) {
      throw new Error("Already joined the server");
    }

    const everyoneRole = await ctx.db
      .query("roles")
      .withIndex("byNameAndServerId", (q) =>
        q.eq("name", "@everyone").eq("serverId", serverId)
      )
      .unique();

    if (!everyoneRole) {
      throw new ConvexError("Everyone Role not found");
    }

    await ctx.db.insert("serverMembers", {
      serverId: serverId,
      userId: userId,
      roleIds: [everyoneRole?._id],
      isMuted: false,
    });

    // console.log("serverId: ",serverId)

    return serverId;
  },
});

export const getServerInfoById = query({
  args: {
    serverId: v.id("servers"),
  },
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

    const server = await ctx.db.get(serverId);

    return {
      serverName: server?.name,
      isMember: !!member,
    };
  },
});
