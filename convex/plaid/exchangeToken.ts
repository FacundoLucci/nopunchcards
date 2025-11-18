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
    const plaidAccounts = accountsResponse.data.accounts;
    const institutionId = accountsResponse.data.item.institution_id || null;

    // 5. Get institution name from Plaid /institutions/get_by_id
    let institutionName = "Bank Account";
    if (institutionId) {
      try {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ["US"], // Adjust based on your needs
        });
        institutionName = institutionResponse.data.institution.name;
      } catch (error) {
        console.error("Failed to fetch institution name:", error);
        // Fall back to using the institution ID if the API call fails
        institutionName = institutionId;
      }
    }

    // 6. Extract detailed account information
    const accounts = plaidAccounts.map((account) => ({
      accountId: account.account_id,
      mask: account.mask || undefined,
      name: account.name,
      officialName: account.official_name || undefined,
      type: account.type,
      subtype: account.subtype || undefined,
    }));

    // 7. Store encrypted token + metadata in plaidAccounts table
    await ctx.runMutation(internal.plaid.helpers.savePlaidAccount, {
      userId,
      plaidItemId,
      plaidAccessTokenCiphertext: encryptedToken,
      accounts,
      institutionId: institutionId || "unknown",
      institutionName,
    });

    // 8. Mark onboarding as complete (user has linked their card)
    await ctx.runMutation(internal.onboarding.mutations.markCardLinked, {});

    // 9. Schedule initial transaction sync (run immediately with runAfter(0))
    await ctx.scheduler.runAfter(0, internal.plaid.syncTransactions.syncTransactions, {
      plaidItemId,
    });

    // 10. Return itemId for client-side confirmation
    return { itemId: plaidItemId };
  },
});

