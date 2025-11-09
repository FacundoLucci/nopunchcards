"use node";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { encrypt } from "./encryption";
import { authComponent } from "../auth";

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

export const exchangePublicToken = action({
  args: { publicToken: v.string() },
  returns: v.object({ itemId: v.string() }),
  handler: async (ctx, args) => {
    // 1. Get authenticated user from Better Auth
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const userId = user.userId || user._id;

    // 2. Exchange public token for access token via Plaid /item/public_token/exchange
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: args.publicToken,
    });
    const accessToken = exchangeResponse.data.access_token;
    const plaidItemId = exchangeResponse.data.item_id;

    // 3. Encrypt access token with AES-256-GCM using ENCRYPTION_SECRET env var
    const encryptedToken = encrypt(accessToken);

    // 4. Get account details from Plaid /accounts/get
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    const accounts = accountsResponse.data.accounts;
    const accountIds = accounts.map((a) => a.account_id);
    const institutionName = accountsResponse.data.item.institution_id || "Unknown";

    // 5. Store encrypted token + metadata in plaidAccounts table
    await ctx.runMutation(internal.plaid.helpers.savePlaidAccount, {
      userId,
      plaidItemId,
      plaidAccessTokenCiphertext: encryptedToken,
      accountIds,
      institutionName,
    });

    // 6. Schedule initial transaction sync (run immediately with runAfter(0))
    await ctx.scheduler.runAfter(0, internal.plaid.syncTransactions.syncTransactions, {
      plaidItemId,
    });

    // 7. Return itemId for client-side confirmation
    return { itemId: plaidItemId };
  },
});

