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
      const ownedServers = await ctx.db
        .query("servers")
        .withIndex("byOwnerId", (q) => q.eq("ownerId", userId))
        .collect();

      const membership = await ctx.db
        .query("serverMembers")
        .withIndex("byUserId", (q) => q.eq("userId", userId))
        .collect();

      const memberServerId = membership.map((m) => m.serverId);

      const memberServer = await Promise.all(
        memberServerId.map((id) => ctx.db.get(id))
      );

      const allServers = [...ownedServers];

      for (const server of memberServer) {
        if (server && !allServers.some((s) => s._id !== server._id)) {
          allServers.push(server);
        }
      }

      return allServers;
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

      const isPermitted = checkPermission({
        ctx,
        memberId: member._id,
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

      const [serverMembers, roles, channels] = await Promise.all([
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
      ]);

      await Promise.all([
        ...serverMembers.map((serverMember) => ctx.db.delete(serverMember._id)),
        ...roles.map((role) => ctx.db.delete(role._id)),
        ...channels.map((channel) => ctx.db.delete(channel._id)),
      ]);

      await ctx.db.delete(serverId);

      return serverId;
    } catch (error) {
      console.error(error);
    }
  },
});
