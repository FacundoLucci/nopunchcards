# Plaid Sandbox Mode Configuration

**Last Updated**: 2025-11-20

## Overview

This document ensures your development server always runs Plaid in **sandbox mode** for safe testing with test credentials and simulated bank data.

## How Plaid Environment Works in This Project

### Architecture

Plaid environment configuration is managed through **Convex environment variables** (not local `.env` files):

- All Plaid API clients read `process.env.PLAID_ENV` 
- This variable is set in your Convex deployment (dev or production)
- The value determines which Plaid API endpoint is used:
  - `sandbox` → https://sandbox.plaid.com
  - `development` → https://development.plaid.com
  - `production` → https://production.plaid.com

### Code Implementation

Every Plaid client in the codebase is initialized like this:

```typescript
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

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
```

Files using this pattern:
- `convex/plaid/linkToken.ts`
- `convex/plaid/exchangeToken.ts`
- `convex/plaid/syncTransactions.ts`
- `convex/plaid/testWebhook.ts`
- `convex/plaid/migrateAccounts.ts`

## ✅ Setting Up Sandbox Mode for Development

### 1. Check Current Configuration

To verify your current Plaid environment:

```bash
npx convex env list | grep PLAID
```

You should see:
```
PLAID_ENV=sandbox
PLAID_CLIENT_ID=67528ce1c45170001aa885f9
PLAID_SECRET=5618db9c54a02af60976065ba33da4
```

### 2. Set Sandbox Mode (If Not Already Set)

If `PLAID_ENV` is not set to `sandbox`, configure it:

```bash
# For development deployment
npx convex env set PLAID_ENV "sandbox"

# Verify the change
npx convex env get PLAID_ENV
```

### 3. Ensure You Have Sandbox Credentials

Your Plaid dashboard should provide:
- **Client ID**: `67528ce1c45170001aa885f9` (already configured)
- **Sandbox Secret**: `5618db9c54a02af60976065ba33da4` (already configured)

These credentials are available in your [Plaid Dashboard](https://dashboard.plaid.com/developers/keys).

## 🧪 Testing in Sandbox Mode

### Sandbox Test Credentials

When using Plaid Link in sandbox mode, use these credentials:

**Standard Test User** (successful flow):
- Username: `user_good`
- Password: `pass_good`
- 2FA Code (if prompted): `1234`

**Other Test Scenarios**:
- `user_bad` / `pass_good` → Simulates invalid credentials
- See [Plaid Sandbox Test Credentials](https://plaid.com/docs/sandbox/test-credentials/) for more

### Available Test Institutions

Sandbox provides several test institutions:
- **First Platypus Bank** - General testing
- **Tartan Bank** - OAuth flows
- **Houndstooth Bank** - MFA scenarios

These appear in the Plaid Link flow when running in sandbox mode.

## 🔒 Environment-Specific Configuration

### Development (Current)
```bash
PLAID_ENV=sandbox
PLAID_CLIENT_ID=67528ce1c45170001aa885f9
PLAID_SECRET=5618db9c54a02af60976065ba33da4
```

### Production (When Ready)
```bash
# Apply for production access first!
npx convex env set PLAID_ENV "production" --prod
npx convex env set PLAID_CLIENT_ID "your-production-client-id" --prod
npx convex env set PLAID_SECRET "your-production-secret" --prod
```

**⚠️ Important**: Never use sandbox credentials with `PLAID_ENV=production` or vice versa!

## 🚀 Running the Dev Server with Sandbox Mode

### Start Development

```bash
# This starts both Convex and Vite
pnpm dev
```

This command runs:
1. `convex dev` - Connects to your Convex dev deployment (uses `PLAID_ENV=sandbox`)
2. `vite dev` - Starts frontend on http://localhost:3000

### Verify Sandbox Mode is Active

When you start the dev server, you can verify sandbox mode by:

1. **Check Convex Logs**:
   ```bash
   # In the convex dev terminal, you should see:
   # "Connected to cloud deployment"
   ```

2. **Test Plaid Link**:
   - Navigate to the account linking flow
   - Click "Launch Link" or "Connect Bank"
   - You should see sandbox test banks like "First Platypus Bank"
   - Use credentials: `user_good` / `pass_good`

3. **Check Webhook Verification** (`convex/plaid/webhookVerification.ts`):
   ```typescript
   const plaidEnv = process.env.PLAID_ENV!;
   // Automatically uses correct webhook verification key for sandbox
   ```

## 📋 Pre-Deployment Checklist

Before deploying or changing environments:

- [ ] Verify `PLAID_ENV=sandbox` in development
- [ ] Test with sandbox credentials (`user_good` / `pass_good`)
- [ ] Confirm test institutions appear in Plaid Link
- [ ] Check webhook handling works with sandbox data
- [ ] Review transactions sync with test data
- [ ] Never commit Plaid secrets to git

## 🐛 Troubleshooting

### Issue: "INVALID_CREDENTIALS" Error

**Cause**: Mismatch between `PLAID_ENV` and credentials.

**Solution**:
```bash
# Check current environment
npx convex env list | grep PLAID

# Ensure sandbox credentials match sandbox environment
npx convex env set PLAID_ENV "sandbox"
```

### Issue: Real Banks Appear Instead of Test Banks

**Cause**: `PLAID_ENV` is set to `development` or `production`.

**Solution**:
```bash
npx convex env set PLAID_ENV "sandbox"
# Restart dev server
pnpm dev
```

### Issue: Webhook Verification Fails

**Cause**: Webhook signature verification uses wrong key for environment.

**Check**: `convex/plaid/webhookVerification.ts` automatically selects the correct key based on `PLAID_ENV`.

**Solution**:
- Ensure `PLAID_ENV=sandbox`
- Verify webhook URL in Plaid dashboard matches your `SITE_URL`
- For local testing, use a tunnel service (ngrok, cloudflared)

### Issue: Cannot Access Convex Env Variables

**Symptom**: `npx convex env list` fails or shows "No CONVEX_DEPLOYMENT set"

**Solution**:
```bash
# Start convex dev to authenticate
npx convex dev

# In a new terminal, then run:
npx convex env list
```

## 📚 Additional Resources

- [Plaid Quickstart Guide](https://plaid.com/docs/quickstart/)
- [Plaid Sandbox Documentation](https://plaid.com/docs/sandbox/)
- [Plaid Test Credentials](https://plaid.com/docs/sandbox/test-credentials/)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)

## 🔄 Next Steps for Production

When you're ready to move beyond sandbox:

1. **Apply for Plaid Production Access**
   - Visit [Plaid Dashboard](https://dashboard.plaid.com)
   - Complete production application
   - Wait for approval (can take several days)

2. **Get Production Credentials**
   - Generate production API keys
   - Update Convex production deployment

3. **Update Environment Variables**
   ```bash
   npx convex deploy
   npx convex env set PLAID_ENV "production" --prod
   npx convex env set PLAID_CLIENT_ID "prod-client-id" --prod
   npx convex env set PLAID_SECRET "prod-secret" --prod
   ```

4. **Test Thoroughly**
   - Start with development environment first
   - Test with a few real accounts
   - Monitor webhook delivery
   - Verify transaction matching

---

**Summary**: Your dev server uses Plaid in sandbox mode by default via `PLAID_ENV=sandbox` in Convex. All Plaid API clients automatically read this environment variable. No additional configuration needed! 🎉

---

_Last updated: 2025-11-20_
