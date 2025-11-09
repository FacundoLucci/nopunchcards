import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

/**
 * Mark card linking step as complete in user onboarding
 * Called after successful Plaid account connection
 */
export const markCardLinked = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user.userId || user._id;

    // Get user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Update onboarding status
    await ctx.db.patch(profile._id, {
      onboarding: {
        hasLinkedCard: true,
        completedAt: Date.now(),
      },
    });

    return null;
  },
});

