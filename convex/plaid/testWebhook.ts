/**
 * Convex action to test Plaid webhook
 *
 * This action calls Plaid's /sandbox/item/fire_webhook endpoint to trigger a test webhook.
 * You can call this from the Convex dashboard or from your app.
 *
 * Usage from Convex dashboard:
 * 1. Go to Functions
 * 2. Find plaid.testWebhook.fireTestWebhook
 * 3. Click "Run"
 * 4. Provide a plaidAccountId from your database
 * 5. Check logs to see webhook received
 */

"use node";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  SandboxItemFireWebhookRequestWebhookCodeEnum,
} from "plaid";
import { decrypt } from "./encryption";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

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

export const fireTestWebhook = internalAction({
  args: {
    plaidAccountId: v.id("plaidAccounts"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    webhookFired: v.boolean(),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; message: string; webhookFired: boolean }> => {
    try {
      // 1. Get the plaid account
      const account: {
        _id: Id<"plaidAccounts">;
        _creationTime: number;
        userId: string;
        plaidItemId: string;
        plaidAccessTokenCiphertext: string;
        accounts: Array<{
          accountId: string;
          mask?: string;
          name: string;
          officialName?: string;
          type: string;
          subtype?: string;
        }>;
        status: "active" | "disconnected" | "error";
        institutionId: string;
        institutionName: string;
        lastSyncedAt?: number;
        syncCursor?: string;
        createdAt: number;
      } | null = await ctx.runQuery(internal.plaid.helpers.getAccountById, {
        accountId: args.plaidAccountId,
      });

      if (!account) {
        return {
          success: false,
          message: "Plaid account not found",
          webhookFired: false,
        };
      }

      // 2. Check if encrypted access token exists
      if (!account.plaidAccessTokenCiphertext) {
        return {
          success: false,
          message:
            "Plaid account is missing encrypted access token. You may need to re-link your bank account.",
          webhookFired: false,
        };
      }

      // 3. Decrypt the access token
      const accessToken = decrypt(account.plaidAccessTokenCiphertext);

      // 3. Fire the test webhook
      console.log("Firing test webhook for item:", account.plaidItemId);

      const response = await plaidClient.sandboxItemFireWebhook({
        access_token: accessToken,
        webhook_code:
          SandboxItemFireWebhookRequestWebhookCodeEnum.NewAccountsAvailable,
      });

      console.log("Test webhook fired successfully!");
      console.log("Response:", JSON.stringify(response.data, null, 2));

      return {
        success: true,
        message: `Test webhook fired for item: ${account.plaidItemId}. Check your Convex logs for 'Plaid webhook received: NEW_ACCOUNTS_AVAILABLE'`,
        webhookFired: true,
      };
    } catch (error: any) {
      console.error("Failed to fire test webhook:", error);

      return {
        success: false,
        message: `Error: ${error.message || "Unknown error"}`,
        webhookFired: false,
      };
    }
  },
});

/**
 * Helper to get the first plaid account for testing
 * Makes it easier to test without knowing the account ID
 */
export const fireTestWebhookAuto = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    webhookFired: v.boolean(),
  }),
  handler: async (
    ctx
  ): Promise<{ success: boolean; message: string; webhookFired: boolean }> => {
    try {
      // Get any plaid account
      type PlaidAccount = {
        _id: Id<"plaidAccounts">;
        _creationTime: number;
        userId: string;
        plaidItemId: string;
        plaidAccessTokenCiphertext: string;
        accounts: Array<{
          accountId: string;
          mask?: string;
          name: string;
          officialName?: string;
          type: string;
          subtype?: string;
        }>;
        status: "active" | "disconnected" | "error";
        institutionId: string;
        institutionName: string;
        lastSyncedAt?: number;
        syncCursor?: string;
        createdAt: number;
      };

      const accounts: PlaidAccount[] = await ctx.runQuery(
        internal.plaid.helpers.getAllAccounts,
        {}
      );

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          message:
            "No Plaid accounts found. Link a bank account first using Plaid Link.",
          webhookFired: false,
        };
      }

      // Use the last linked account
      const lastAccount: PlaidAccount = accounts[accounts.length - 1];
      const plaidAccountId: Id<"plaidAccounts"> = lastAccount._id;
      console.log(`Using last linked plaid account: ${plaidAccountId}`);

      // Fire the webhook directly (avoiding circular dependency)
      const account: PlaidAccount | null = await ctx.runQuery(
        internal.plaid.helpers.getAccountById,
        { accountId: plaidAccountId }
      );

      if (!account) {
        return {
          success: false,
          message: "Plaid account not found",
          webhookFired: false,
        };
      }

      // Check if encrypted access token exists
      if (!account.plaidAccessTokenCiphertext) {
        return {
          success: false,
          message:
            "Plaid account is missing encrypted access token. You may need to re-link your bank account.",
          webhookFired: false,
        };
      }

      // Decrypt the access token
      const accessToken = decrypt(account.plaidAccessTokenCiphertext);

      // Fire the test webhook
      console.log("Firing test webhook for item:", account.plaidItemId);

      const response = await plaidClient.sandboxItemFireWebhook({
        access_token: accessToken,
        webhook_code:
          SandboxItemFireWebhookRequestWebhookCodeEnum.NewAccountsAvailable,
      });

      console.log("Test webhook fired successfully!");
      console.log("Response:", JSON.stringify(response.data, null, 2));

      return {
        success: true,
        message: `Test webhook fired for item: ${account.plaidItemId}. Check your Convex logs for 'Plaid webhook received: NEW_ACCOUNTS_AVAILABLE'`,
        webhookFired: true,
      };
    } catch (error: any) {
      console.error("Failed to fire test webhook:", error);

      return {
        success: false,
        message: `Error: ${error.message || "Unknown error"}`,
        webhookFired: false,
      };
    }
  },
});
