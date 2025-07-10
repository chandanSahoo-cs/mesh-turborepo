import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createWorkspaces = mutation({
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

      const workspaceId = await ctx.db.insert("workspace", {
        name: name,
        ownerId: userId,
        joinCode,
      });

      if (!workspaceId) {
        throw new ConvexError("Failed to create workspace");
      }

      return workspaceId;
    } catch (error) {
      console.log(error);
    }
  },
});

export const getWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    try {
      const workspaces = await ctx.db.query("workspace").collect();
      if (!workspaces) {
        throw new ConvexError("No workspace exists");
      }
      return workspaces;
    } catch (error) {
      console.log(error);
    }
  },
});

export const getWorkspaceById = query({
  args: { id: v.id("workspace") },
  handler: async (ctx, { id }) => {
    try {
      const userId = await getAuthUserId(ctx);

      if (!userId) {
        throw new ConvexError("Unauthorized user");
      }

      const workspace = await ctx.db.get(id);

      if (!workspace) {
        throw new ConvexError("Failed to fetch workspace");
      }
      return workspace;
    } catch (error) {
      console.log(error)
    }
  },
});
