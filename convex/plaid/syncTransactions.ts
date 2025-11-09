"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { decrypt } from "./encryption";

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV!],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
    },
  })
);

export const syncTransactions = internalAction({
  args: { plaidItemId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get plaidAccount record by itemId using by_plaidItemId index
    const account = await ctx.runQuery(internal.plaid.helpers.getAccountByItemId, {
      plaidItemId: args.plaidItemId,
    });
    if (!account) {
      throw new Error(`Plaid account not found for itemId: ${args.plaidItemId}`);
    }

    // 2. Decrypt access token using ENCRYPTION_SECRET (AES-256-GCM)
    const accessToken = decrypt(account.plaidAccessTokenCiphertext);

    // 3. Call Plaid /transactions/sync endpoint with stored cursor
    //    Uses cursor-based pagination (more efficient than date ranges)
    const syncResponse = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: account.syncCursor || undefined, // undefined for initial sync
      options: {
        include_personal_finance_category: true, // Get enriched categories
      },
    });

    const { added, modified, removed, next_cursor, has_more } = syncResponse.data;

    // 4. Process added transactions (new since last sync)
    for (const plaidTx of added) {
      // 4a. Check if transaction already exists by plaidTransactionId index (idempotency)
      const existingTx = await ctx.runQuery(
        internal.plaid.helpers.getTransactionByPlaidId,
        {
          plaidTransactionId: plaidTx.transaction_id,
        }
      );

      // 4b. If exists, skip (defensive - shouldn't happen with sync cursor)
      if (existingTx) {
        console.warn(`Transaction already exists: ${plaidTx.transaction_id}`);
        continue;
      }

      // 4c. Insert new transaction with status: "unmatched"
      await ctx.runMutation(internal.plaid.helpers.insertTransaction, {
        plaidTransactionId: plaidTx.transaction_id,
        userId: account.userId,
        plaidAccountId: account._id,
        amount: Math.round(plaidTx.amount * 100), // Convert dollars → cents integer
        currency: plaidTx.iso_currency_code || "USD",
        merchantName: plaidTx.merchant_name || plaidTx.name || undefined,
        date: plaidTx.date, // Already in YYYY-MM-DD format from Plaid
        category: plaidTx.personal_finance_category
          ? [plaidTx.personal_finance_category.primary]
          : undefined,
        status: "unmatched",
      });
    }

    // 5. Process modified transactions (amount/date changed after posting)
    for (const plaidTx of modified) {
      const existingTx = await ctx.runQuery(
        internal.plaid.helpers.getTransactionByPlaidId,
        {
          plaidTransactionId: plaidTx.transaction_id,
        }
      );

      if (existingTx) {
        await ctx.runMutation(internal.plaid.helpers.updateTransaction, {
          transactionId: existingTx._id,
          amount: Math.round(plaidTx.amount * 100),
          merchantName: plaidTx.merchant_name || plaidTx.name || undefined,
          date: plaidTx.date,
          // Note: Don't change status or businessId on modification
        });
      }
    }

    // 6. Process removed transactions (refunds, reversals)
    for (const removedTx of removed) {
      const existingTx = await ctx.runQuery(
        internal.plaid.helpers.getTransactionByPlaidId,
        {
          plaidTransactionId: removedTx.transaction_id,
        }
      );

      if (existingTx) {
        // Mark as removed rather than deleting (keeps audit trail)
        await ctx.runMutation(internal.plaid.helpers.markTransactionRemoved, {
          transactionId: existingTx._id,
        });
      }
    }

    // 7. Update plaidAccount with lastSyncedAt timestamp and new cursor
    await ctx.runMutation(internal.plaid.helpers.updateSyncMetadata, {
      accountId: account._id,
      lastSyncedAt: Date.now(),
      syncCursor: next_cursor,
    });

    // 8. If has_more=true, there are more transactions - schedule continuation
    if (has_more) {
      await ctx.scheduler.runAfter(0, internal.plaid.syncTransactions.syncTransactions, {
        plaidItemId: args.plaidItemId,
      });
    }

    // 9. If we added new transactions, schedule matching job
    if (added.length > 0) {
      await ctx.scheduler.runAfter(0, internal.matching.processNewTransactions.processNewTransactions, {});
    }

    return null;
  },
});

