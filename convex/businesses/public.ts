import { query } from "../_generated/server";
import { v } from "convex/values";

// Get business by slug (public - no auth required)
export const getBySlug = query({
  args: { slug: v.string() },
    returns: v.union(
      v.null(),
      v.object({
        _id: v.id("businesses"),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        category: v.string(),
        address: v.optional(v.string()),
        website: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        brandColors: v.optional(
          v.object({
            primary: v.string(),
            secondary: v.optional(v.string()),
            accent: v.optional(v.string()),
          })
        ),
        brandSummary: v.optional(v.string()),
        googleRating: v.optional(v.number()),
        googleReviewCount: v.optional(v.number()),
        status: v.string(),
      })
    ),
  handler: async (ctx, args) => {
    // 1. Look up business by slug using by_slug index
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    // 2. Return null if not found
    if (!business) {
      return null;
    }

    // 3. Return public fields (including status so frontend can show verification badge)
    // Note: Unverified businesses can be viewed but won't match transactions
      return {
        _id: business._id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        category: business.category,
        address: business.address,
        website: business.website,
        logoUrl: business.logoUrl,
        brandColors: business.brandColors,
        brandSummary: business.brandSummary,
        googleRating: business.googleRating,
        googleReviewCount: business.googleReviewCount,
        status: business.status,
      };
  },
});

// Get active reward programs for a business (public - no auth required)
export const getActivePrograms = query({
  args: { businessId: v.id("businesses") },
  returns: v.array(
    v.object({
      _id: v.id("rewardPrograms"),
      name: v.string(),
      description: v.optional(v.string()),
      type: v.string(),
      rules: v.union(
        v.object({ 
          visits: v.number(), 
          reward: v.string(),
          minimumSpendCents: v.optional(v.number())
        }),
        v.object({ 
          spendAmountCents: v.number(), 
          reward: v.string() 
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    // 1. Get all active programs for this business
    const programs = await ctx.db
      .query("rewardPrograms")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // 2. Return public fields only
    return programs.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      type: p.type,
      rules: p.rules,
    }));
  },
});

// Get stats for business public page (public - no auth required)
export const getStats = query({
  args: { businessId: v.id("businesses") },
  returns: v.object({
    totalCustomers: v.number(),
    totalRewards: v.number(),
  }),
  handler: async (ctx, args) => {
    // 1. Count unique customers (distinct userId in rewardProgress)
    const progressRecords = await ctx.db
      .query("rewardProgress")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    const uniqueCustomers = new Set(progressRecords.map((p) => p.userId)).size;

    // 2. Sum total rewards earned (completed progress records)
      const totalRewards = progressRecords
        .filter((p) => p.status === "completed" || p.status === "redeemed")
        .reduce((sum, p) => sum + p.totalEarned, 0);

    return {
      totalCustomers: uniqueCustomers,
      totalRewards,
    };
  },
});
