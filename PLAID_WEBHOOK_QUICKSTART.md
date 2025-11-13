# Plaid Webhook Testing - Quick Start

_Last updated: 2025-11-12_

## TL;DR - Fastest Way to Test

```bash
# Option 1: Test directly from Convex dashboard (EASIEST!)
1. Open Convex dashboard: https://dashboard.convex.dev
2. Go to Functions
3. Find: plaid.testWebhook.fireTestWebhookAuto
4. Click "Run"
5. Check Logs tab for "Plaid webhook received: NEW_ACCOUNTS_AVAILABLE"

# Option 2: Using command line
export PLAID_CLIENT_ID="your_client_id"
export PLAID_SECRET="your_sandbox_secret"
npx tsx scripts/test-plaid-webhook.ts "access-sandbox-xxxxx"
```

## What I've Set Up For You

✅ **Added `NEW_ACCOUNTS_AVAILABLE` webhook handler** in `convex/http.ts`
✅ **Created test action** at `convex/plaid/testWebhook.ts` (call from dashboard)
✅ **Created test scripts** in `scripts/` directory
✅ **Added helper queries** to get Plaid accounts

## Your Webhook Endpoint

Your webhook is live at:

```
https://[your-deployment].convex.site/api/plaid/webhook
```

You need to register this URL in Plaid dashboard:
1. Go to https://dashboard.plaid.com/team/webhooks
2. Add your webhook URL for **Sandbox** environment
3. Save

## Testing Options (Pick One)

### Option 1: From Convex Dashboard (Recommended!)

This is the easiest way - no command line needed!

**Steps:**

1. **Link a bank account** (if you haven't already):
   - Open your app
   - Go to Settings → Connect Bank Account
   - Use Plaid Link with sandbox credentials:
     - Username: `user_good`
     - Password: `pass_good`

2. **Fire test webhook from dashboard**:
   - Open https://dashboard.convex.dev
   - Select your deployment
   - Click "Functions" tab
   - Search for: `plaid.testWebhook.fireTestWebhookAuto`
   - Click "Run" button
   - Wait for result (should show `success: true`)

3. **Verify in logs**:
   - Click "Logs" tab
   - Look for: `"Plaid webhook received: NEW_ACCOUNTS_AVAILABLE"`
   - You should also see: `"New accounts available for item: item-xxxxx"`

**Success looks like:**
```
Plaid webhook received: NEW_ACCOUNTS_AVAILABLE for item item-sandbox-xxxxx
New accounts available for item: item-sandbox-xxxxx
```

### Option 2: Using Test Script

If you prefer command line or need to automate testing:

**Prerequisites:**
```bash
export PLAID_CLIENT_ID="your_client_id"
export PLAID_SECRET="your_sandbox_secret"
```

**Get access token** (two options):

A. From Convex dashboard:
- Open plaidAccounts table
- Copy a `plaidAccessTokenCiphertext` value
- Decrypt it (see below)

B. Temporarily log it:
- Add to `convex/plaid/exchangeToken.ts` line 40:
  ```typescript
  console.log("ACCESS TOKEN FOR TESTING:", accessToken);
  ```
- Re-link a bank account
- Check Convex logs for the token
- Remove the console.log after

**Run test:**
```bash
npx tsx scripts/test-plaid-webhook.ts "access-sandbox-xxxxx"
```

**Expected output:**
```
🧪 Testing Plaid webhook...
Webhook type: NEW_ACCOUNTS_AVAILABLE

✅ Test webhook fired successfully!

Check your Convex logs to see if the webhook was received.
Look for log message: 'Plaid webhook received: NEW_ACCOUNTS_AVAILABLE'
```

### Option 3: Quick Endpoint Check

Just to verify your endpoint is configured (will fail signature check, which is expected):

```bash
export VITE_CONVEX_URL="https://your-deployment.convex.cloud"
npx tsx scripts/test-webhook-direct.ts
```

Expected: `401 Unauthorized` (proves signature verification works!)

## Helper: Decrypt Access Token

If you need to decrypt a token from the database:

```typescript
// Save as decrypt-token.ts
import { decrypt } from "./convex/plaid/encryption";

const encrypted = "your-encrypted-token-here";
const decrypted = decrypt(encrypted);
console.log(decrypted);
```

Run:
```bash
npx tsx decrypt-token.ts
```

## What to Look For

**In Convex Logs (Success):**
```
Plaid webhook received: NEW_ACCOUNTS_AVAILABLE for item item-sandbox-xxxxx
New accounts available for item: item-sandbox-xxxxx
```

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "No Plaid accounts found" | Link a bank account first using Plaid Link |
| "Missing Plaid-Verification header" | Using direct test (expected) - use Option 1 or 2 |
| "Invalid signature" | Check PLAID_CLIENT_ID and PLAID_SECRET match |
| "Webhook URL not registered" | Add webhook URL in Plaid dashboard |

## For Plaid Production Application

When submitting to Plaid for production approval, include:

1. **Webhook URL**: `https://[your-deployment].convex.site/api/plaid/webhook`
2. **Screenshot**: Convex logs showing successful webhook receipt
3. **Confirmation**: JWS signature verification is enabled
4. **Code Reference**: Point to `convex/http.ts` and `convex/plaid/webhookVerification.ts`

## Next Steps

After successful webhook test:

1. ✅ Mark webhook testing complete in Plaid dashboard
2. Continue with other Plaid production requirements
3. Test other webhook types (INITIAL_UPDATE, DEFAULT_UPDATE, etc.)
4. Set up monitoring for webhook delivery failures

## Need Help?

See detailed documentation: [PLAID_WEBHOOK_TESTING.md](./PLAID_WEBHOOK_TESTING.md)

**Quick troubleshooting:**
- Convex logs show all webhook activity
- Plaid dashboard shows webhook delivery attempts
- Check that webhook URL is registered for correct environment (sandbox/dev/prod)

---

_Ready to test? Start with Option 1 from the Convex dashboard - it's the easiest!_

