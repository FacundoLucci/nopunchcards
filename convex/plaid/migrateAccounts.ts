"use node";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode } from "plaid";
import { decrypt } from "./encryption";
import type { Id } from "../_generated/dataModel";

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

export const migrateOldAccounts = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all plaid accounts
      const accounts = await ctx.runQuery(internal.plaid.helpers.getAllAccounts, {});

      for (const account of accounts) {
        // Skip if already migrated (has `accounts` field)
        if (account.accounts && account.accounts.length > 0) {
          continue;
        }

        try {
          // Decrypt access token
          const accessToken = decrypt(account.plaidAccessTokenCiphertext);

          // Fetch account details from Plaid
          const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken,
          });
          const plaidAccounts = accountsResponse.data.accounts;
          const institutionId = accountsResponse.data.item.institution_id || "unknown";

          // Get institution name
          let institutionName = account.institutionName || "Bank Account";
          if (institutionId && institutionId !== institutionName) {
            try {
              const institutionResponse = await plaidClient.institutionsGetById({
                institution_id: institutionId,
                country_codes: [CountryCode.Us],
              });
              institutionName = institutionResponse.data.institution.name;
            } catch (error) {
              console.error(`Failed to fetch institution name for ${institutionId}:`, error);
              // Keep existing institutionName as fallback
            }
          }

          // Extract detailed account information
          const detailedAccounts = plaidAccounts.map((acc) => ({
            accountId: acc.account_id,
            mask: acc.mask || undefined,
            name: acc.name,
            officialName: acc.official_name || undefined,
            type: acc.type,
            subtype: acc.subtype || undefined,
          }));

          // Update the record
          await ctx.runMutation(internal.plaid.helpers.updateAccountWithMigration, {
            accountId: account._id,
            accounts: detailedAccounts,
            institutionId,
            institutionName,
          });

          migratedCount++;
          console.log(`Migrated account ${account._id} (${institutionName})`);
        } catch (error) {
          const errorMsg = `Failed to migrate account ${account._id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return {
        success: true,
        migratedCount,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        migratedCount,
        errors: [`Migration failed: ${error}`, ...errors],
      };
    }
  },
});


