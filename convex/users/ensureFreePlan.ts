// Helper to ensure user has the free plan assigned
// Last updated: 2025-11-17
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import { autumn } from "../autumn";

/**
 * Ensures the authenticated user has a subscription plan.
 * If they don't have any plan, assigns the free plan automatically.
 * This is called during signup and login to ensure all users have a plan.
 */
export const ensureUserHasFreePlan = internalAction({
  args: {},
  returns: v.object({
    hadPlan: v.boolean(),
    assignedFreePlan: v.boolean(),
  }),
  handler: async (ctx) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    const userId = user.userId || user._id;

    console.log("[ensureUserHasFreePlan] Checking plan for userId:", userId);

    try {
      // Assign free plan to user via Autumn
      // The attach method will handle cases where user already has a plan
      console.log("[ensureUserHasFreePlan] Assigning free plan to user");
      const { data, error } = await autumn.attach(ctx, {
        productId: "free", // Free tier product ID from autumn.config.ts
      });
      
      if (error) {
        console.error(
          "[ensureUserHasFreePlan] Error assigning free plan:",
          error
        );
        return {
          hadPlan: false,
          assignedFreePlan: false,
        };
      }

      console.log("[ensureUserHasFreePlan] Free plan assigned successfully");
      return {
        hadPlan: false,
        assignedFreePlan: true,
      };
    } catch (error) {
      console.error(
        "[ensureUserHasFreePlan] Error checking/assigning plan:",
        error
      );
      // Don't throw - this is a non-critical enhancement
      // Plan can be assigned later if needed
      return {
        hadPlan: false,
        assignedFreePlan: false,
      };
    }
  },
});

