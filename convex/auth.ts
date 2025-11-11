import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";
import authSchema from "./betterAuth/schema";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    verbose: false,
    local: { schema: authSchema },
  }
);

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  return betterAuth({
    // disable logging when createAuth is called just to generate options.
    // this is not required, but there's a lot of noise in logs without it.
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex(),
    ],
  });
};

// Helper to get current user with profile
// This joins Better Auth user (component) with our profiles table (app)
export const getCurrentUserWithProfile = async (ctx: any) => {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    console.log("getCurrentUserWithProfile: No user from authComponent");
    return null;
  }

  const userId = user.userId || user._id;
  console.log("getCurrentUserWithProfile: userId =", userId);
  
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  console.log("getCurrentUserWithProfile: profile found =", !!profile, profile?._id);

  return { ...user, id: userId, profile };
};

// Example function for getting the current user
// Returns null if not authenticated (doesn't throw)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await authComponent.getAuthUser(ctx);
    } catch (error) {
      // Return null instead of throwing when unauthenticated
      return null;
    }
  },
});
