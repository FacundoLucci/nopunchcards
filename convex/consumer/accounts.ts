import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

// Query to list all linked Plaid accounts for the authenticated user
export const listLinkedAccounts = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("plaidAccounts"),
      _creationTime: v.number(),
      institutionName: v.optional(v.string()),
      accountIds: v.array(v.string()),
      status: v.union(
        v.literal("active"),
        v.literal("disconnected"),
        v.literal("error")
      ),
      lastSyncedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    // Return empty array if not authenticated instead of throwing
    if (!user) return [];

    const userId = user.userId || user._id;

    const accounts = await ctx.db
      .query("plaidAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Return accounts without sensitive data (no access token)
    return accounts.map((account) => ({
      _id: account._id,
      _creationTime: account._creationTime,
      institutionName: account.institutionName,
      accountIds: account.accountIds,
      status: account.status,
      lastSyncedAt: account.lastSyncedAt,
      createdAt: account.createdAt,
    }));
  },
});

// Query to get transactions for a specific account
export const getAccountTransactions = query({
  args: { accountId: v.id("plaidAccounts"), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("transactions"),
      merchantName: v.optional(v.string()),
      businessName: v.optional(v.string()),
      amount: v.number(),
      date: v.string(),
      currentVisits: v.optional(v.number()),
      totalVisits: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("matched"),
        v.literal("unmatched")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    // Return empty array if not authenticated instead of throwing
    if (!user) return [];

    const userId = user.userId || user._id;

    // Verify the account belongs to the user
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) {
      return [];
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .filter((q) => q.eq(q.field("plaidAccountId"), args.accountId))
      .take(args.limit || 20);

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
              q.eq(q.field("userId"), userId),
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
        status: tx.status,
      });
    }

    return result;
  },
});

// Mutation to disconnect a Plaid account
export const disconnectAccount = mutation({
  args: {
    accountId: v.id("plaidAccounts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const userId = user.userId || user._id;

    // Verify the account belongs to this user
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.userId !== userId) {
      throw new Error("Unauthorized: This account does not belong to you");
    }

    // Update status to disconnected instead of deleting
    // This preserves transaction history
    await ctx.db.patch(args.accountId, {
      status: "disconnected",
    });

    return null;
  },
});

// Mutation to permanently delete a disconnected account and its transactions
export const deleteAccount = mutation({
  args: {
    accountId: v.id("plaidAccounts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const userId = user.userId || user._id;

    // Verify the account belongs to this user
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.userId !== userId) {
      throw new Error("Unauthorized: This account does not belong to you");
    }

    // Only allow deletion of disconnected accounts
    if (account.status !== "disconnected") {
      throw new Error(
        "Account must be disconnected before deletion. Disconnect the account first."
      );
    }

    // Delete all transactions associated with this account
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", userId))
      .collect();

    const accountTransactions = transactions.filter(
      (tx) => tx.plaidAccountId === args.accountId
    );

    for (const tx of accountTransactions) {
      await ctx.db.delete(tx._id);
    }

    // Delete the account itself
    await ctx.db.delete(args.accountId);

    return null;
  },
});
