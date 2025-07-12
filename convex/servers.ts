import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
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

      const owner = await ctx.db.insert("serverMembers",{
        serverId,
        userId,
        roleIds:[everyoneRoleId]
      })

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
