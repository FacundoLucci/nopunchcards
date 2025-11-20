// Signup-related mutations
// Last updated: 2025-11-17
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import { internal } from "../_generated/api";
import type { FunctionReference } from "convex/server";

// Create user profile immediately after signup
// Called from the signup page to ensure profile exists with correct role
export const createProfileAfterSignup = mutation({
  args: {
    role: v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    ),
  },
  returns: v.object({
    profileId: v.id("profiles"),
    wasCreated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    const userId = user.userId || user._id;

    console.log(
      "[createProfileAfterSignup] Creating profile for userId:",
      userId,
      "role:",
      args.role
    );

    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      console.log(
        "[createProfileAfterSignup] Profile already exists:",
        existing._id,
        "current role:",
        existing.role
      );

      // If role is different, update it
      if (existing.role !== args.role) {
        console.log(
          "[createProfileAfterSignup] Updating role from",
          existing.role,
          "to",
          args.role
        );
        await ctx.db.patch(existing._id, { role: args.role });
      }

      return {
        profileId: existing._id,
        wasCreated: false,
      };
    }

    // Create new profile with specified role
    console.log(
      "[createProfileAfterSignup] Creating new profile with role:",
      args.role
    );
    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: args.role,
      createdAt: Date.now(),
    });

    console.log("[createProfileAfterSignup] Created profile:", profileId);

    // Automatically assign free plan to new users via Autumn
    // Schedule the action to run asynchronously (mutations cannot call actions directly)
    console.log("[createProfileAfterSignup] Scheduling free plan assignment");
    // Type assertion needed due to naming conflict between users.ts and users/ directory
    // @ts-ignore - TypeScript has difficulty with deeply nested generated types
    const freePlanRef = internal["users/ensureFreePlan"].ensureUserHasFreePlan;
    await ctx.scheduler.runAfter(0, freePlanRef, {});

    return {
      profileId,
      wasCreated: true,
    };
  },
});
