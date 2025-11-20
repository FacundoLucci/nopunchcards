// Role check query for route guards
import { query } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

export const checkUserRole = query({
  args: {},
  returns: v.union(
    v.object({
      role: v.union(
        v.literal("consumer"),
        v.literal("business_owner"),
        v.literal("admin")
      ),
      userId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    // IMPORTANT: authComponent.getAuthUser() throws if not authenticated
    // Wrap in try-catch to handle session expiration gracefully
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch (error) {
      // User is not authenticated (session expired or not logged in)
      return null;
    }

    const userId = user.userId || user._id;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      // User authenticated but no profile - might need onboarding
      return null;
    }

    return {
      role: profile.role,
      userId,
    };
  },
});

