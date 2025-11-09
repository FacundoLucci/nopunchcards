import { internalAction, internalQuery, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const processNewTransactions = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const BATCH_SIZE = 100;

    // 1. Query transactions with status="unmatched" using by_status index
    //    Process newest first (order desc), limit to batch size
    const unmatchedTxs: Array<{ _id: any; userId: string }> = await ctx.runQuery(
      internal.matching.processNewTransactions.getUnmatchedTransactions,
      {
        limit: BATCH_SIZE,
      }
    );

    if (unmatchedTxs.length === 0) {
      console.log("No unmatched transactions to process");
      return null;
    }

    console.log(`Processing ${unmatchedTxs.length} unmatched transactions`);

    // 2. Process each unmatched transaction
    for (const tx of unmatchedTxs) {
      // 2a. Call matchTransaction internal mutation
      //     Returns businessId if confident match found, null otherwise
      const matchedBusinessId = await ctx.runMutation(
        internal.matching.matchTransaction.matchTransaction,
        {
          transactionId: tx._id,
        }
      );

      // 2b. If businessId returned, update transaction and calculate rewards
      if (matchedBusinessId) {
        // Update transaction with matched businessId and status="matched"
        await ctx.runMutation(
          internal.matching.processNewTransactions.updateMatchedTransaction,
          {
            transactionId: tx._id,
            businessId: matchedBusinessId,
          }
        );

        // Calculate and update reward progress for this match
        await ctx.runMutation(internal.matching.calculateRewards.calculateRewards, {
          userId: tx.userId,
          businessId: matchedBusinessId,
          transactionId: tx._id,
        });
      }
      // If null returned, transaction remains status="unmatched" for next run
    }

    // 3. If processed full batch (100), there may be more unmatched transactions
    //    Schedule another run immediately to continue processing
    if (unmatchedTxs.length >= BATCH_SIZE) {
      console.log("Full batch processed, scheduling continuation");
      await ctx.scheduler.runAfter(0, internal.matching.processNewTransactions.processNewTransactions, {});
    }

    return null;
  },
});

// Helper queries and mutations
export const getUnmatchedTransactions = internalQuery({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      _id: v.id("transactions"),
      userId: v.string(),
      merchantName: v.optional(v.string()),
      amount: v.number(),
      date: v.string(),
      category: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_status", (q) => q.eq("status", "unmatched"))
      .order("desc") // Newest first
      .take(args.limit);
  },
});

export const updateMatchedTransaction = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    businessId: v.id("businesses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      businessId: args.businessId,
      status: "matched",
    });
    return null;
  },
});

