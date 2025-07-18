import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new ConvexError("User is not authenticated!");
      }

      return await ctx.db.get(userId);
    } catch (error) {
      console.error(error);
    }
  },
});
