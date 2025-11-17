import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserWithProfile } from "./auth";
import { authComponent } from "./auth";
import type { Doc } from "./_generated/dataModel";
import { profileValidator } from "./schema";

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
      phone: v.optional(v.string()),
      preferences: v.optional(v.any()),
      onboarding: v.optional(
        v.object({
          hasLinkedCard: v.boolean(),
          completedAt: v.optional(v.number()),
        })
      ),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx): Promise<Doc<"profiles"> | null> => {
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

    return profile;
  },
});

// Ensure profile exists for current user with specified role
export const ensureProfile = mutation({
  args: {
    role: v.optional(
      v.union(
        v.literal("consumer"),
        v.literal("business_owner"),
        v.literal("admin")
      )
    ),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    // authComponent.getAuthUser() throws if not authenticated
    const user = await authComponent.getAuthUser(ctx);
    const userId = user.userId || user._id;

    console.log("ensureProfile called - userId:", userId, "role:", args.role);

    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      console.log(
        "Profile exists:",
        existing._id,
        "current role:",
        existing.role
      );
      // IMPORTANT: Never modify existing roles - this prevents accidental role changes
      // Roles should only be changed through explicit admin functions
      return existing._id;
    }

    // Create new profile with specified role (default: consumer)
    console.log("Creating new profile with role:", args.role || "consumer");
    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: args.role || "consumer",
      createdAt: Date.now(),
    });
    console.log("Created profile:", profileId);
    return profileId;
  },
});

// Helper: Require specific role(s) - throws error if not authorized
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"consumer" | "business_owner" | "admin">
) {
  console.log("requireRole called - allowedRoles:", allowedRoles);

  // Get Better Auth user and join with profiles table
  const userWithProfile = await getCurrentUserWithProfile(ctx);

  if (!userWithProfile) {
    console.error("requireRole: Not authenticated");
    throw new Error("Not authenticated");
  }

  console.log(
    "requireRole: userId =",
    userWithProfile.id,
    "has profile:",
    !!userWithProfile.profile
  );

  if (!userWithProfile.profile) {
    console.error(
      "requireRole: Profile not found for userId:",
      userWithProfile.id
    );
    throw new Error("Profile not found - user may need to complete onboarding");
  }

  const userRole = userWithProfile.profile.role;
  console.log("requireRole: user role =", userRole);

  if (!allowedRoles.includes(userRole)) {
    console.error(
      "requireRole: Forbidden - user role",
      userRole,
      "not in",
      allowedRoles
    );
    throw new Error(
      `Forbidden: Requires role [${allowedRoles.join(" or ")}], ` +
        `but user has role [${userRole}]`
    );
  }

  console.log("requireRole: Success - user authorized");
  return userWithProfile;
}

// Helper: Try to require role, but return null instead of throwing if profile missing
// Useful for queries that should gracefully handle incomplete onboarding
export async function tryRequireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"consumer" | "business_owner" | "admin">
) {
  try {
    return await requireRole(ctx, allowedRoles);
  } catch (error: any) {
    if (error.message?.includes("Profile not found")) {
      // Return null if profile not found - let frontend handle redirect
      return null;
    }
    // Re-throw other errors (authentication, authorization)
    throw error;
  }
}

// Update user's name in Better Auth user table
export const updateName = mutation({
  args: {
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Update the user's name in the Better Auth user table
    // Type assertion needed because Better Auth tables aren't in our DataModel
    await ctx.db.patch(user._id as any, { name: args.name });
    return null;
  },
});

// Get account information (user + profile)
export const getAccountInfo = query({
  args: {},
  returns: v.union(
    v.object({
      email: v.string(),
      name: v.string(),
      emailVerified: v.boolean(),
      createdAt: v.number(),
      role: v.union(
        v.literal("consumer"),
        v.literal("business_owner"),
        v.literal("admin")
      ),
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

    return {
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      role: profile?.role || "consumer",
    };
  },
});
