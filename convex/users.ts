import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserWithProfile } from "./auth";
import { authComponent } from "./auth";

// Get current user's profile
export const getMyProfile = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("profiles"),
      _creationTime: v.number(),
      userId: v.string(),
      role: v.union(
        v.literal("consumer"),
        v.literal("business_owner"),
        v.literal("admin")
      ),
      createdAt: v.number(),
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const userId = user.userId || user._id;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

// Ensure profile exists for current user (call after signup)
export const ensureProfile = mutation({
  args: {},
  returns: v.union(v.id("profiles"), v.null()),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const userId = user.userId || user._id;

    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create new profile with consumer role
    return await ctx.db.insert("profiles", {
      userId,
      role: "consumer",
      createdAt: Date.now(),
    });
  },
});

// Helper: Require specific role(s) - throws error if not authorized
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"consumer" | "business_owner" | "admin">
) {
  // Get Better Auth user and join with profiles table
  const userWithProfile = await getCurrentUserWithProfile(ctx);

  if (!userWithProfile) {
    throw new Error("Not authenticated");
  }

  if (!userWithProfile.profile) {
    throw new Error("Profile not found - user may need to complete onboarding");
  }

  const userRole = userWithProfile.profile.role;

  if (!allowedRoles.includes(userRole)) {
    throw new Error(
      `Forbidden: Requires role [${allowedRoles.join(" or ")}], ` +
        `but user has role [${userRole}]`
    );
  }

  return userWithProfile;
}

