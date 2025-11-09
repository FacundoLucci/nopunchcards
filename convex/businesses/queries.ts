import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../users";

export const getMyBusinesses = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("businesses"),
      name: v.string(),
      slug: v.string(),
      category: v.string(),
      status: v.string(),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const user = await requireRole(ctx, ["business_owner", "admin"]);

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
    const user = await requireRole(ctx, ["business_owner", "admin"]);

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

