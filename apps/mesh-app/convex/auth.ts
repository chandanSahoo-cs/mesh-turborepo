// Taken from convex documentation, setups the auth for my app

import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword, GitHub, Google],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (user && user.status === undefined) {
        await ctx.db.patch(userId, {
          effectiveStatus: "online",
          manualStatus: "online",
          lastSeen: Date.now(),
        });
        await ctx.db.patch(userId, {});
      }
    },
  },
});
