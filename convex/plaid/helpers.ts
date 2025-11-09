import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getAccountByItemId = internalQuery({
  args: { plaidItemId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("plaidAccounts"),
      userId: v.string(),
      plaidAccessTokenCiphertext: v.string(),
      syncCursor: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plaidAccounts")
      .withIndex("by_plaidItemId", (q) => q.eq("plaidItemId", args.plaidItemId))
      .unique();
  },
});

export const getTransactionByPlaidId = internalQuery({
  args: { plaidTransactionId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("transactions"),
      businessId: v.optional(v.id("businesses")),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_plaidTransactionId", (q) =>
        q.eq("plaidTransactionId", args.plaidTransactionId)
      )
      .unique();
  },
});

export const savePlaidAccount = internalMutation({
  args: {
    userId: v.string(),
    plaidItemId: v.string(),
    plaidAccessTokenCiphertext: v.string(),
    accountIds: v.array(v.string()),
    institutionName: v.string(),
  },
  returns: v.id("plaidAccounts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("plaidAccounts", {
      ...args,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const insertTransaction = internalMutation({
  args: {
    plaidTransactionId: v.string(),
    userId: v.string(),
    plaidAccountId: v.id("plaidAccounts"),
    amount: v.number(),
    currency: v.string(),
    merchantName: v.optional(v.string()),
    date: v.string(),
    category: v.optional(v.array(v.string())),
    status: v.literal("unmatched"),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateTransaction = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    amount: v.number(),
    merchantName: v.optional(v.string()),
    date: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { transactionId, ...updates } = args;
    await ctx.db.patch(transactionId, updates);
    return null;
  },
});

export const markTransactionRemoved = internalMutation({
  args: { transactionId: v.id("transactions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete removed transactions (or could mark as status: "removed")
    await ctx.db.delete(args.transactionId);
    return null;
  },
});

export const updateSyncMetadata = internalMutation({
  args: {
    accountId: v.id("plaidAccounts"),
    lastSyncedAt: v.number(),
    syncCursor: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, {
      lastSyncedAt: args.lastSyncedAt,
      syncCursor: args.syncCursor,
    });
    return null;
  },
});

