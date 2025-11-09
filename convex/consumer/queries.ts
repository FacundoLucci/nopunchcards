import { query } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

// Get consumer's active reward progress
export const getActiveProgress = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("rewardProgress"),
      businessId: v.id("businesses"),
      businessName: v.string(),
      currentVisits: v.number(),
      totalVisits: v.number(),
      rewardDescription: v.string(),
      programName: v.string(),
    })
  ),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    // Return empty array if not authenticated instead of throwing
    if (!user) return [];

    const userId = user.userId || user._id;

    const progressRecords = await ctx.db
      .query("rewardProgress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const result = [];
    for (const progress of progressRecords) {
      const business = await ctx.db.get(progress.businessId);
      const program = await ctx.db.get(progress.rewardProgramId);

      if (business && program) {
        result.push({
          _id: progress._id,
          businessId: progress.businessId,
          businessName: business.name,
          currentVisits: progress.currentVisits,
          totalVisits: program.rules.visits,
          rewardDescription: program.rules.reward,
          programName: program.name,
        });
      }
    }

    return result;
  },
});

// Get recent transactions
export const getRecentTransactions = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("transactions"),
      merchantName: v.optional(v.string()),
      businessName: v.optional(v.string()),
      amount: v.number(),
      date: v.string(),
      currentVisits: v.optional(v.number()),
      totalVisits: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    // Return empty array if not authenticated instead of throwing
    if (!user) return [];

    const userId = user.userId || user._id;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);

    const result = [];
    for (const tx of transactions) {
      let businessName = undefined;
      let currentVisits = undefined;
      let totalVisits = undefined;

      if (tx.businessId) {
        const business = await ctx.db.get(tx.businessId);
        businessName = business?.name;

        // Get active progress for this business
        const progress = await ctx.db
          .query("rewardProgress")
          .withIndex("by_businessId", (q) => q.eq("businessId", tx.businessId!))
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), user.userId || user._id),
              q.eq(q.field("status"), "active")
            )
          )
          .unique();

        if (progress) {
          const program = await ctx.db.get(progress.rewardProgramId);
          if (program) {
            currentVisits = progress.currentVisits;
            totalVisits = program.rules.visits;
          }
        }
      }

      result.push({
        _id: tx._id,
        merchantName: tx.merchantName,
        businessName,
        amount: tx.amount,
        date: tx.date,
        currentVisits,
        totalVisits,
      });
    }

    return result;
  },
});

