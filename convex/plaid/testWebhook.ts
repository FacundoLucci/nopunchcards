"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { Configuration, PlaidApi, PlaidEnvironments, SandboxItemFireWebhookRequestWebhookCodeEnum } from "plaid";
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

export const fireTestWebhook = action({
  args: {
    plaidItemId: v.string(),
    webhookCode: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    webhookFired: v.boolean(),
  }),
  handler: async (ctx, args) => {
    console.log("🔥 Firing test webhook for item:", args.plaidItemId);

    // Get the plaid account to retrieve access token
    const plaidAccount = await ctx.runQuery(
      (ctx) => ctx.db
        .query("plaidAccounts")
        .withIndex("by_plaidItemId", (q) => q.eq("plaidItemId", args.plaidItemId))
        .first()
    );

    if (!plaidAccount) {
      throw new Error(`Plaid account not found for item: ${args.plaidItemId}`);
    }

    // Decrypt the access token
    const accessToken = decrypt(plaidAccount.plaidAccessTokenCiphertext);

    // Determine webhook code (default to NEW_ACCOUNTS_AVAILABLE for testing)
    const webhookCode = args.webhookCode || "NEW_ACCOUNTS_AVAILABLE";

    try {
      // Fire the webhook
      const response = await plaidClient.sandboxItemFireWebhook({
        access_token: accessToken,
        webhook_code: webhookCode as SandboxItemFireWebhookRequestWebhookCodeEnum,
      });

      console.log("✅ Webhook fired successfully:", response.data);

      return {
        success: true,
        message: `Webhook ${webhookCode} fired successfully. Check your Convex logs for webhook receipt.`,
        webhookFired: response.data.webhook_fired,
      };
    } catch (error: any) {
      console.error("❌ Error firing webhook:", error);
      
      return {
        success: false,
        message: `Failed to fire webhook: ${error.message}`,
        webhookFired: false,
      };
    }
  },
});

// Convenience action to test with the most common webhook types
export const testWebhooks = action({
  args: {
    plaidItemId: v.string(),
  },
  returns: v.object({
    results: v.array(v.object({
      webhookCode: v.string(),
      success: v.boolean(),
      message: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    const webhookCodesToTest = [
      "NEW_ACCOUNTS_AVAILABLE",
      "DEFAULT_UPDATE",
      "HISTORICAL_UPDATE",
    ];

    const results = [];

    for (const webhookCode of webhookCodesToTest) {
      console.log(`Testing webhook: ${webhookCode}`);
      
      const result = await ctx.runAction(
        (ctx) => ctx.runAction(fireTestWebhook as any, {
          plaidItemId: args.plaidItemId,
          webhookCode,
        })
      );

      results.push({
        webhookCode,
        success: result.success,
        message: result.message,
      });

      // Wait a bit between webhook fires to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { results };
  },
});
