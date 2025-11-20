import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Manually rematch a transaction that was previously marked as "no_match"
 * This is useful when a business is verified after the transaction was created
 */
export const rematchTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    matchedBusinessId: v.optional(v.id("businesses")),
  }),
  handler: async (ctx, args) => {
    // Get the transaction
    const tx = await ctx.db.get(args.transactionId);
    if (!tx) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Reset status to "unmatched" so it can be reprocessed
    await ctx.db.patch(args.transactionId, {
      status: "unmatched",
      businessId: undefined, // Clear any old match
    });

    // Schedule the processing cron to run immediately
    await ctx.scheduler.runAfter(
      0,
      internal.matching.processNewTransactions.processNewTransactions,
      {}
    );

    return {
      success: true,
      message: "Transaction reset to 'unmatched' and processing scheduled. Check back in a few seconds.",
    };
  },
});

/**
 * Force match a transaction to a specific business (admin override)
 */
export const forceMatchTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    businessId: v.id("businesses"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the transaction
    const tx = await ctx.db.get(args.transactionId);
    if (!tx) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Get the business
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      return {
        success: false,
        message: "Business not found",
      };
    }

    // Force match the transaction
    await ctx.db.patch(args.transactionId, {
      businessId: args.businessId,
      status: "matched",
    });

    // Calculate rewards for this match
    await ctx.scheduler.runAfter(
      0,
      internal.matching.calculateRewards.calculateRewards,
      {
        userId: tx.userId,
        businessId: args.businessId,
        transactionId: args.transactionId,
      }
    );

    return {
      success: true,
      message: `Transaction force-matched to "${business.name}" and rewards calculated!`,
    };
  },
});

