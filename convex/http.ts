import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent, createAuth } from "./auth";
import { verifyPlaidWebhook } from "./plaid/webhookVerification";
import { resendComponent } from "./sendEmails";

const http = httpRouter();

// Better Auth routes (handles all /api/auth/* endpoints)
authComponent.registerRoutes(http, createAuth);

// Plaid webhook with JWS verification (required for security)
http.route({
  path: "/api/plaid/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Get Plaid-Verification header containing JWS signature
    const plaidVerification = request.headers.get("Plaid-Verification");
    
    if (!plaidVerification) {
      console.error("Missing Plaid-Verification header");
      return new Response("Unauthorized: Missing signature", { status: 401 });
    }

    // 2. Extract keyId from signature header (JWS format)
    //    Header is a JWS: header.payload.signature
    //    We need to decode the header part to get the 'kid'
    let keyId: string;
    try {
      const [headerEncoded] = plaidVerification.split(".");
      const header = JSON.parse(atob(headerEncoded));
      keyId = header.kid;
    } catch (error) {
      console.error("Failed to parse Plaid-Verification header", error);
      return new Response("Invalid signature format", { status: 401 });
    }

    if (!keyId) {
      console.error("No kid found in Plaid-Verification header");
      return new Response("Invalid signature format", { status: 401 });
    }

    // 3. Read request body as text (needed for signature verification)
    const bodyText = await request.text();

    // 4. Verify JWS signature using Plaid's public key
    const isValid = await verifyPlaidWebhook(
      bodyText,
      plaidVerification,
      keyId
    );
    if (!isValid) {
      console.error("Invalid Plaid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // 5. Parse verified webhook payload
    const payload = JSON.parse(bodyText);
    const { webhook_code, item_id } = payload;

    console.log(`Plaid webhook received: ${webhook_code} for item ${item_id}`);

    // 6. Handle different webhook codes
    switch (webhook_code) {
      case "INITIAL_UPDATE":
        // Initial transaction data is ready (right after Link)
        console.log("Initial update - scheduling sync");
        await ctx.scheduler.runAfter(
          0,
          internal.plaid.syncTransactions.syncTransactions,
          {
            plaidItemId: item_id,
          }
        );
        break;

      case "HISTORICAL_UPDATE":
        // Historical data finished loading (2+ years)
        console.log("Historical update complete - scheduling sync");
        await ctx.scheduler.runAfter(
          0,
          internal.plaid.syncTransactions.syncTransactions,
          {
            plaidItemId: item_id,
          }
        );
        break;

      case "DEFAULT_UPDATE":
        // New transaction data available (regular updates)
        console.log("Default update - scheduling sync");
        await ctx.scheduler.runAfter(
          0,
          internal.plaid.syncTransactions.syncTransactions,
          {
            plaidItemId: item_id,
          }
        );
        break;

      case "TRANSACTIONS_REMOVED":
        // Transactions were deleted/refunded (rare)
        console.log("Transactions removed - handling separately");
        // Could schedule a full re-sync or handle removed_transactions array
        break;

      case "NEW_ACCOUNTS_AVAILABLE":
        // New accounts are available for the Item (test webhook)
        console.log("New accounts available for item:", item_id);
        // In production, you might want to re-link the item or notify the user
        // For now, just log it (this is mainly used for webhook testing)
        break;

      default:
        console.log(`Unhandled Plaid webhook code: ${webhook_code}`);
    }

    // 7. Return 200 OK to acknowledge receipt
    return new Response("OK", { status: 200 });
  }),
});

// Resend webhook (email delivery/bounce/spam events)
http.route({
  path: "/api/resend/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Resend component handles HMAC verification internally using RESEND_WEBHOOK_SECRET
    return await resendComponent.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
