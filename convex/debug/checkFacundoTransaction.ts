import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Debug query to check FACUNDO transaction and business status
 * Run this in the Convex dashboard to see what's happening
 */
export const checkFacundoStatus = query({
  args: {},
  returns: v.object({
    business: v.union(
      v.object({
        _id: v.id("businesses"),
        name: v.string(),
        status: v.string(),
        statementDescriptors: v.optional(v.array(v.string())),
      }),
      v.null()
    ),
    rewardPrograms: v.array(
      v.object({
        _id: v.id("rewardPrograms"),
        name: v.string(),
        type: v.string(),
        status: v.string(),
        rules: v.any(),
      })
    ),
    recentTransactions: v.array(
      v.object({
        _id: v.id("transactions"),
        merchantName: v.optional(v.string()),
        amount: v.number(),
        status: v.string(),
        businessId: v.optional(v.id("businesses")),
        date: v.string(),
      })
    ),
    rewardProgress: v.array(
      v.object({
        _id: v.id("rewardProgress"),
        businessId: v.id("businesses"),
        currentVisits: v.number(),
        status: v.string(),
      })
    ),
  }),
  handler: async (ctx) => {
    // Find FACUNDO business
    const allBusinesses = await ctx.db.query("businesses").collect();
    const facundoBusiness = allBusinesses.find(
      (b) => b.name.toLowerCase() === "facundo"
    );

    // Get reward programs for FACUNDO
    let rewardPrograms: Array<{
      _id: any;
      name: string;
      type: string;
      status: string;
      rules: any;
    }> = [];
    if (facundoBusiness) {
      const programs = await ctx.db
        .query("rewardPrograms")
        .withIndex("by_businessId", (q) =>
          q.eq("businessId", facundoBusiness._id)
        )
        .collect();

      rewardPrograms = programs.map((p) => ({
        _id: p._id,
        name: p.name,
        type: p.type,
        status: p.status,
        rules: p.rules,
      }));
    }

    // Get recent transactions with "FACUNDO" merchant name
    const allTransactions = await ctx.db
      .query("transactions")
      .order("desc")
      .take(50);

    const facundoTransactions = allTransactions
      .filter(
        (t) =>
          t.merchantName &&
          t.merchantName.toLowerCase().includes("facundo")
      )
      .slice(0, 10)
      .map((t) => ({
        _id: t._id,
        merchantName: t.merchantName,
        amount: t.amount,
        status: t.status,
        businessId: t.businessId,
        date: t.date,
      }));

    // Get reward progress for FACUNDO (if business exists)
    let rewardProgress: Array<{
      _id: any;
      businessId: any;
      currentVisits: number;
      status: string;
    }> = [];
    if (facundoBusiness) {
      const progress = await ctx.db
        .query("rewardProgress")
        .withIndex("by_businessId", (q) =>
          q.eq("businessId", facundoBusiness._id)
        )
        .collect();

      rewardProgress = progress.map((p) => ({
        _id: p._id,
        businessId: p.businessId,
        currentVisits: p.currentVisits,
        status: p.status,
      }));
    }

    return {
      business: facundoBusiness
        ? {
            _id: facundoBusiness._id,
            name: facundoBusiness.name,
            status: facundoBusiness.status,
            statementDescriptors: facundoBusiness.statementDescriptors,
          }
        : null,
      rewardPrograms,
      recentTransactions: facundoTransactions,
      rewardProgress,
    };
  },
});

