# Plaid Webhook Testing Guide

_Last updated: 2025-11-12_

## Overview

This guide walks you through testing Plaid webhooks as required for Plaid production approval. Plaid requires you to demonstrate that your webhook endpoint is properly configured and can receive the `NEW_ACCOUNTS_AVAILABLE` webhook.

## What Was Set Up

✅ **Webhook Endpoint**: `/api/plaid/webhook` in `convex/http.ts`
✅ **JWS Signature Verification**: Using Plaid's public keys for security
✅ **NEW_ACCOUNTS_AVAILABLE Handler**: Added to handle test webhook
✅ **Test Scripts**: Created for easy testing

## Webhook URL

Your webhook endpoint is available at:

```
https://your-deployment.convex.site/api/plaid/webhook
```

Replace `your-deployment` with your actual Convex deployment URL.

### For Local Development

If testing locally, you'll need to expose your local endpoint using a tunnel:

```bash
# Option 1: Using ngrok
npx ngrok http 3000

# Option 2: Using cloudflared
cloudflared tunnel --url http://localhost:3000
```

Then use the public URL provided by the tunnel service.

## Register Webhook URL in Plaid Dashboard

1. Go to https://dashboard.plaid.com/team/webhooks
2. Add your webhook URL for the appropriate environment:
   - **Sandbox**: `https://your-deployment.convex.site/api/plaid/webhook`
   - **Development**: Same URL (or ngrok URL for local testing)
   - **Production**: Your production Convex URL

## Testing Methods

### Method 1: Using Plaid's Sandbox API (Recommended)

This is the official method Plaid recommends for webhook testing.

**Prerequisites:**
- At least one Plaid item linked (run through Plaid Link once)
- Access token for that item

**Steps:**

1. **Link a test account** (if you haven't already):
   - Open your app
   - Connect a bank account using Plaid Link
   - Use sandbox credentials (username: `user_good`, password: `pass_good`)

2. **Get the access token**:
   
   Option A - From Convex dashboard:
   - Open https://dashboard.convex.dev
   - Navigate to your deployment
   - Open the `plaidAccounts` table
   - Find the recently linked account
   - Copy the `plaidAccessTokenCiphertext` value
   - You'll need to decrypt it (see encryption script below)

   Option B - Log it during linking:
   - Temporarily add a console.log in `convex/plaid/exchangeToken.ts`
   - Re-link an account
   - Copy the access token from logs

3. **Fire the test webhook**:

   ```bash
   # Set environment variables
   export PLAID_CLIENT_ID="your_client_id"
   export PLAID_SECRET="your_sandbox_secret"
   
   # Run the test script
   npx tsx scripts/test-plaid-webhook.ts "access-sandbox-xxxxx"
   ```

4. **Verify in Convex logs**:
   - Open Convex dashboard
   - Go to Logs tab
   - Look for: `"Plaid webhook received: NEW_ACCOUNTS_AVAILABLE"`
   - You should see: `"New accounts available for item: item-xxxxx"`

### Method 2: Direct Webhook Test (Quick Check)

This tests your endpoint configuration but won't pass signature verification:

```bash
# Set your Convex URL
export VITE_CONVEX_URL="https://your-deployment.convex.cloud"

# Test the endpoint
npx tsx scripts/test-webhook-direct.ts
```

Expected result: `401 Unauthorized` (this is correct - proves signature verification is working)

## Helper: Decrypt Access Token

If you need to decrypt an access token from the database:

```typescript
// convex/scripts/decrypt-token.ts
import { decrypt } from "../convex/plaid/encryption";

const encryptedToken = "your-encrypted-token-from-db";
const accessToken = decrypt(encryptedToken);
console.log("Access token:", accessToken);
```

Run it:
```bash
npx tsx convex/scripts/decrypt-token.ts
```

## Webhook Security Features

Your webhook endpoint implements Plaid's security requirements:

1. **JWS Signature Verification**
   - Extracts `Plaid-Verification` header
   - Retrieves signing key from Plaid
   - Verifies signature using RSASSA-PKCS1-v1_5 with SHA-256
   - Rejects webhooks with invalid signatures

2. **Idempotency**
   - Transaction IDs are checked before insertion
   - Duplicate webhooks are safely ignored

3. **Error Handling**
   - Invalid signatures return 401
   - Missing headers return 401
   - Processing errors are logged

## Webhook Codes Handled

Your endpoint currently handles these webhook codes:

- ✅ `INITIAL_UPDATE` - Initial transaction data ready
- ✅ `HISTORICAL_UPDATE` - Historical data complete
- ✅ `DEFAULT_UPDATE` - New transactions available
- ✅ `TRANSACTIONS_REMOVED` - Transactions deleted/refunded
- ✅ `NEW_ACCOUNTS_AVAILABLE` - New accounts available (test webhook)

Additional webhook codes will log as "Unhandled" but won't error.

## Troubleshooting

### "Missing Plaid-Verification header"

**Issue**: Webhook returns 401 with this message

**Solutions**:
- If testing directly: This is expected - use Method 1 instead
- If from Plaid: Check webhook URL is correctly registered

### "Invalid Plaid webhook signature"

**Issue**: Webhook returns 401 after signature check

**Solutions**:
- Verify `PLAID_CLIENT_ID` and `PLAID_SECRET` are correct
- Check `PLAID_ENV` matches the webhook source (sandbox/development/production)
- Ensure environment variables are set in Convex (not just locally)

### "Failed to fetch Plaid verification key"

**Issue**: Can't retrieve public key from Plaid

**Solutions**:
- Check internet connectivity from Convex
- Verify Plaid credentials are correct
- Check Plaid API status: https://status.plaid.com

### Webhook not received at all

**Issue**: Test script succeeds but no logs in Convex

**Solutions**:
- Verify webhook URL is registered in Plaid dashboard
- For local testing, ensure tunnel (ngrok) is running
- Check Convex deployment is active
- Look for errors in Convex function logs

## Production Checklist

Before moving to production:

- [ ] Webhook URL registered in Plaid dashboard for all environments
- [ ] Tested `NEW_ACCOUNTS_AVAILABLE` webhook successfully
- [ ] Verified signature verification is working (401 for invalid signatures)
- [ ] Confirmed transaction syncing works after webhooks
- [ ] Set up monitoring/alerting for webhook failures
- [ ] Documented webhook handling for your team
- [ ] Updated `PLAID_ENV` to `production` in Convex
- [ ] Using production Plaid credentials

## Plaid Production Application

When submitting your production application to Plaid, you'll need to show:

1. ✅ Webhook endpoint URL
2. ✅ Evidence of successful test webhook (screenshot of logs)
3. ✅ Confirmation of signature verification
4. ✅ Description of how you handle each webhook type

Include screenshots from:
- Convex logs showing received webhook
- Test script output showing successful webhook fire
- Your webhook handling code

## Next Steps

After webhook testing is complete:

1. Continue with other Plaid production requirements
2. Implement additional webhook handlers as needed
3. Set up monitoring for webhook health
4. Add retry logic for failed webhook processing
5. Document incident response procedures

## Resources

- [Plaid Webhook Documentation](https://plaid.com/docs/api/webhooks/)
- [Webhook Verification Guide](https://plaid.com/docs/api/webhooks/webhook-verification/)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [Plaid Production Checklist](https://plaid.com/docs/account/going-to-production/)

## Support

If you encounter issues:

1. Check Convex logs for detailed error messages
2. Review Plaid dashboard webhook delivery logs
3. Verify environment variables in Convex
4. Test with the direct test script first
5. Contact Plaid support with webhook delivery logs if needed

---

_For questions about this setup, refer to the code in `convex/http.ts` and `convex/plaid/webhookVerification.ts`_

