import { query } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

/**
 * Get the current user's onboarding status
 * Returns onboarding progress information for consumers
 */
export const getOnboardingStatus = query({
  args: {},
  returns: v.union(
    v.object({
      isComplete: v.boolean(),
      hasLinkedCard: v.boolean(),
      needsOnboarding: v.boolean(),
      completedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const userId = user.userId || user._id;

    // Get user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      return {
        isComplete: false,
        hasLinkedCard: false,
        needsOnboarding: true,
        completedAt: undefined,
      };
    }

    // Check if user has linked a card (for consumers)
    const hasLinkedCard = profile.onboarding?.hasLinkedCard ?? false;

    // For consumers, onboarding is complete when they've linked a card
    // For business owners, different onboarding flow (not implemented here)
    const isComplete =
      profile.role === "consumer"
        ? hasLinkedCard
        : profile.role === "business_owner"
          ? false // TODO: Implement business onboarding
          : true; // Admin has no onboarding

    return {
      isComplete,
      hasLinkedCard,
      needsOnboarding: !isComplete,
      completedAt: profile.onboarding?.completedAt,
    };
  },
});

