import { query } from "../_generated/server";
import { v } from "convex/values";
import { tryRequireRole } from "../users";

export const getMyBusinesses = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("businesses"),
      _creationTime: v.number(), // System field
      name: v.string(),
      slug: v.string(),
      category: v.string(),
      status: v.string(),
      ownerId: v.string(),
      createdAt: v.number(),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      mccCodes: v.optional(v.array(v.string())),
      statementDescriptors: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx) => {
    // Try to get user with role, but handle missing profile gracefully
    const user = await tryRequireRole(ctx, ["business_owner", "admin"]);
    
    // If no profile (user hasn't completed onboarding), return empty array
    // OnboardingGuard will redirect user to onboarding
    if (!user) {
      console.log("getMyBusinesses: No profile found, returning empty array");
      return [];
    }

    return await ctx.db
      .query("businesses")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user.id))
      .collect();
  },
});

export const getDashboardStats = query({
  args: { businessId: v.id("businesses") },
  returns: v.object({
    totalVisits: v.number(),
    totalRewards: v.number(),
    totalCustomers: v.number(),
    averageVisits: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await tryRequireRole(ctx, ["business_owner", "admin"]);
    
    if (!user) {
      throw new Error("Not authenticated or profile not found");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    if (business.ownerId !== user.id && user.profile?.role !== "admin") {
      throw new Error("Forbidden");
    }

    // Get all progress records for this business
    const progressRecords = await ctx.db
      .query("rewardProgress")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalVisits = progressRecords.reduce(
      (sum, p) => sum + p.currentVisits,
      0
    );
    const totalRewards = progressRecords.filter(
      (p) => p.status === "completed"
    ).length;
    const uniqueCustomers = new Set(progressRecords.map((p) => p.userId)).size;
    const averageVisits =
      uniqueCustomers > 0 ? totalVisits / uniqueCustomers : 0;

    return {
      totalVisits,
      totalRewards,
      totalCustomers: uniqueCustomers,
      averageVisits: Math.round(averageVisits * 10) / 10,
    };
  },
});

