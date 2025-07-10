import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

      const joinCode = "123456";

      const serverId = await ctx.db.insert("servers", {
        name: name,
        ownerId: userId,
        joinCode,
      });

      if (!serverId) {
        throw new ConvexError("Failed to create server");
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
      const servers = await ctx.db.query("servers").collect();
      if (!servers) {
        throw new ConvexError("No server exists");
      }
      return servers;
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
        throw new ConvexError("Failed to fetch server");
      }
      return server;
    } catch (error) {
      console.log(error)
    }
  },
});
