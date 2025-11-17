import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a mock transaction for testing/demo purposes
 * Bypasses Plaid integration and creates a transaction directly
 * Works without authentication - uses the last created consumer user
 */
export const createMockTransaction = mutation({
  args: {
    merchantName: v.string(),
    amount: v.optional(v.number()), // Amount in cents, defaults to random
  },
  returns: v.object({
    success: v.boolean(),
    transactionId: v.optional(v.id("transactions")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Find the most recently created consumer user
    const consumerProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "consumer"))
      .order("desc")
      .collect();

    if (consumerProfiles.length === 0) {
      return {
        success: false,
        error: "No consumer users found. Please create a consumer account first.",
      };
    }

    // Get the most recent consumer (sorted by createdAt descending)
    const lastConsumer = consumerProfiles.sort(
      (a, b) => b.createdAt - a.createdAt
    )[0];

    // Get the user's most recent plaidAccount (last added payment method)
    const plaidAccounts = await ctx.db
      .query("plaidAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", lastConsumer.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (plaidAccounts.length === 0) {
      return {
        success: false,
        error: "Consumer has no payment method linked. Please link a card first.",
      };
    }

    // Sort by createdAt to get the most recent one
    const lastPlaidAccount = plaidAccounts.sort(
      (a, b) => b.createdAt - a.createdAt
    )[0];

    // Generate mock transaction data
    const now = new Date();
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const mockTransactionId = `mock_${lastConsumer.userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Use provided amount or generate random amount between $10-$100
    const transactionAmount = args.amount || Math.floor(Math.random() * 9000) + 1000;

    // Create the transaction
    const transactionId = await ctx.db.insert("transactions", {
      plaidTransactionId: mockTransactionId,
      userId: lastConsumer.userId,
      plaidAccountId: lastPlaidAccount._id,
      amount: transactionAmount,
      currency: "USD",
      merchantName: args.merchantName,
      date: dateString,
      category: ["Shopping", "General Merchandise"],
      status: "unmatched", // Will be processed by transaction matching cron
      createdAt: Date.now(),
    });

    return {
      success: true,
      transactionId,
    };
  },
});

