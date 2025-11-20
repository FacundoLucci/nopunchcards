import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Internal query to get plaid account by item ID
export const getAccountByItemId = internalQuery({
  args: {
    plaidItemId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("plaidAccounts"),
      _creationTime: v.number(),
      plaidAccessTokenCiphertext: v.string(),
      plaidItemId: v.string(),
      userId: v.string(),
      syncCursor: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("plaidAccounts")
      .withIndex("by_plaidItemId", (q) => q.eq("plaidItemId", args.plaidItemId))
      .first();

    if (!account) {
      return null;
    }

    return {
      _id: account._id,
      _creationTime: account._creationTime,
      plaidAccessTokenCiphertext: account.plaidAccessTokenCiphertext,
      plaidItemId: account.plaidItemId,
      userId: account.userId,
      syncCursor: account.syncCursor,
    };
  },
});

// TODO: Implement these helper functions properly
export const getAllAccounts = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("plaidAccounts"),
      plaidAccessTokenCiphertext: v.string(),
      plaidItemId: v.string(),
      accounts: v.optional(v.array(v.any())),
      institutionName: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const accounts = await ctx.db.query("plaidAccounts").collect();
    return accounts.map((acc) => ({
      _id: acc._id,
      plaidAccessTokenCiphertext: acc.plaidAccessTokenCiphertext,
      plaidItemId: acc.plaidItemId,
      accounts: acc.accounts,
      institutionName: acc.institutionName,
    }));
  },
});

export const savePlaidAccount = internalMutation({
  args: {
    userId: v.string(),
    plaidItemId: v.string(),
    plaidAccessTokenCiphertext: v.string(),
    accounts: v.array(
      v.object({
        accountId: v.string(),
        mask: v.optional(v.string()),
        name: v.string(),
        officialName: v.optional(v.string()),
        type: v.string(),
        subtype: v.optional(v.string()),
      })
    ),
    institutionId: v.string(),
    institutionName: v.string(),
  },
  returns: v.id("plaidAccounts"),
  handler: async (ctx, args) => {
    const accountId = await ctx.db.insert("plaidAccounts", {
      userId: args.userId,
      plaidItemId: args.plaidItemId,
      plaidAccessTokenCiphertext: args.plaidAccessTokenCiphertext,
      accounts: args.accounts,
      institutionId: args.institutionId,
      institutionName: args.institutionName,
      status: "active",
      createdAt: Date.now(),
    });

    return accountId;
  },
});

/**
 * Update an existing Plaid account or create a new one if it doesn't exist.
 * This prevents duplicate records when a user re-links the same bank account.
 *
 * Identifies existing accounts by plaidItemId and updates them with new:
 * - Access token (after re-authentication)
 * - Account list (in case new accounts were added)
 * - Institution metadata
 * - Resets status to "active" if previously disconnected
 */
export const updateAccountWithMigration = internalMutation({
  args: {
    userId: v.string(),
    plaidItemId: v.string(),
    plaidAccessTokenCiphertext: v.string(),
    accounts: v.array(
      v.object({
        accountId: v.string(),
        mask: v.optional(v.string()),
        name: v.string(),
        officialName: v.optional(v.string()),
        type: v.string(),
        subtype: v.optional(v.string()),
      })
    ),
    institutionId: v.string(),
    institutionName: v.string(),
  },
  returns: v.id("plaidAccounts"),
  handler: async (ctx, args) => {
    // Check if account already exists for this plaidItemId
    const existingAccount = await ctx.db
      .query("plaidAccounts")
      .withIndex("by_plaidItemId", (q) => q.eq("plaidItemId", args.plaidItemId))
      .first();

    if (existingAccount) {
      // Update existing account (re-linking scenario)
      await ctx.db.patch(existingAccount._id, {
        plaidAccessTokenCiphertext: args.plaidAccessTokenCiphertext,
        accounts: args.accounts,
        institutionId: args.institutionId,
        institutionName: args.institutionName,
        status: "active", // Reset to active in case it was disconnected
        // Keep original createdAt, don't update it
      });

      return existingAccount._id;
    } else {
      // Create new account (first time linking)
      const accountId = await ctx.db.insert("plaidAccounts", {
        userId: args.userId,
        plaidItemId: args.plaidItemId,
        plaidAccessTokenCiphertext: args.plaidAccessTokenCiphertext,
        accounts: args.accounts,
        institutionId: args.institutionId,
        institutionName: args.institutionName,
        status: "active",
        createdAt: Date.now(),
      });

      return accountId;
    }
  },
});

export const getTransactionByPlaidId = internalQuery({
  args: { plaidTransactionId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_plaidTransactionId", (q) =>
        q.eq("plaidTransactionId", args.plaidTransactionId)
      )
      .first();

    if (!transaction) {
      return null;
    }

    return {
      _id: transaction._id,
      _creationTime: transaction._creationTime,
    };
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("transactions", {
      plaidTransactionId: args.plaidTransactionId,
      userId: args.userId,
      plaidAccountId: args.plaidAccountId,
      amount: args.amount,
      currency: args.currency,
      merchantName: args.merchantName,
      date: args.date,
      category: args.category,
      status: args.status,
      createdAt: Date.now(),
    });
    return null;
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
    await ctx.db.patch(args.transactionId, {
      amount: args.amount,
      merchantName: args.merchantName,
      date: args.date,
    });
    return null;
  },
});

export const markTransactionRemoved = internalMutation({
  args: {
    transactionId: v.id("transactions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // We don't actually delete, just mark as removed or handle as needed
    // For now, maybe we just delete it since it was removed in Plaid
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
