// Ensure profile exists - called automatically on first authenticated request
// Last updated: 2025-11-17
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import { internal } from "../_generated/api";

/**
 * Ensures a profile exists for the current user.
 * This is a safety mechanism that runs automatically when profile is missing.
 * It infers the role from the signup context if available, otherwise defaults to consumer.
 */
export const ensureProfileExists = mutation({
  args: {
    // Optional: explicitly set role (used during signup)
    role: v.optional(
      v.union(
        v.literal("consumer"),
        v.literal("business_owner"),
        v.literal("admin")
      )
    ),
  },
  returns: v.object({
    profileId: v.id("profiles"),
    wasCreated: v.boolean(),
    role: v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    ),
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user.userId || user._id;

    console.log("[ensureProfileExists] Checking profile for userId:", userId);

    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      console.log("[ensureProfileExists] Profile exists:", existing._id);
      return {
        profileId: existing._id,
        wasCreated: false,
        role: existing.role,
      };
    }

    // Profile doesn't exist - create it with the specified or default role
    const role = args.role || "consumer";
    
    console.log(
      "[ensureProfileExists] Creating profile with role:",
      role
    );

    const profileId = await ctx.db.insert("profiles", {
      userId,
      role,
      createdAt: Date.now(),
    });

    console.log("[ensureProfileExists] Profile created:", profileId);

    // Schedule free plan assignment
    try {
      // @ts-ignore - TypeScript has difficulty with deeply nested generated types
      const freePlanRef = internal["users/ensureFreePlan"].ensureUserHasFreePlan;
      await ctx.scheduler.runAfter(0, freePlanRef, {});
      console.log("[ensureProfileExists] Scheduled free plan assignment");
    } catch (error) {
      console.error("[ensureProfileExists] Error scheduling free plan:", error);
      // Don't fail profile creation if plan assignment fails
    }

    return {
      profileId,
      wasCreated: true,
      role,
    };
  },
});

