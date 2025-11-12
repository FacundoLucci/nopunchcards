# Plaid Production Deployment Checklist

**Last Updated:** 2025-11-12

This guide covers everything you need to transition your Plaid integration from sandbox to production.

---

## Overview

Your current setup uses Plaid's **sandbox environment** (`PLAID_ENV=sandbox`). To go live, you need to:
1. Apply for Production Access with Plaid
2. Update credentials and environment variables
3. Test with real bank accounts in Development mode
4. Deploy to Production

---

## Step 1: Apply for Plaid Production Access

### 1.1 Complete Plaid Dashboard Requirements

Visit your [Plaid Dashboard](https://dashboard.plaid.com/) and:

1. **Complete Company Profile**
   - Business name, address, website
   - Tax ID (EIN)
   - Description of your use case

2. **Submit Production Application**
   - Navigate to "Team Settings" → "Production Access"
   - Fill out the application form
   - Provide details about:
     - What data you're accessing (Transactions)
     - How you're using the data (Loyalty rewards matching)
     - Expected user volume
     - Privacy policy URL
     - Terms of service URL

3. **Required Documents**
   - Privacy Policy (must mention Plaid and data usage)
   - Terms of Service
   - Proof of business registration (may be required)

4. **Review Timeline**
   - Initial review: 1-3 business days
   - Additional info requests: 1-5 business days
   - Total time: Typically 1-2 weeks

### 1.2 Products to Enable

For your loyalty platform, request:
- ✅ **Transactions** (primary product you're using)
- ⚠️ **Optional:** Auth (if you need bank account/routing numbers)

---

## Step 2: Get Production Credentials

Once approved, Plaid will provide:

1. **Production Credentials**
   - Navigate to "Team Settings" → "Keys"
   - Copy your Production `client_id` and `secret`
   - These are different from sandbox credentials

2. **Development Credentials** (for testing)
   - Also available in the Keys section
   - Use these to test with real banks before going live

---

## Step 3: Update Convex Environment Variables

### 3.1 Development Environment (Optional but Recommended)

Test with real banks before production:

```bash
# Create a development deployment
npx convex deploy --cmd "npx convex dev --once" --project your-project --dev

# Set development credentials
npx convex env set PLAID_ENV "development"
npx convex env set PLAID_CLIENT_ID "your-development-client-id"
npx convex env set PLAID_SECRET "your-development-secret"
```

### 3.2 Production Environment

```bash
# Deploy to production
npx convex deploy --prod

# Set production environment variables
npx convex env set PLAID_ENV "production" --prod
npx convex env set PLAID_CLIENT_ID "your-production-client-id" --prod
npx convex env set PLAID_SECRET "your-production-secret" --prod

# Update site URL to production domain
npx convex env set SITE_URL "https://yourdomain.com" --prod

# Verify all environment variables are set
npx convex env list --prod
```

### 3.3 Important: Keep Other Secrets Updated

When deploying to production, also set:

```bash
# Generate NEW production keys (don't reuse development keys)

# 1. VAPID keys for push notifications
npx web-push generate-vapid-keys
npx convex env set VAPID_PUBLIC_KEY "new-prod-public-key" --prod
npx convex env set VAPID_PRIVATE_KEY "new-prod-private-key" --prod

# 2. Encryption key for Plaid access tokens
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx convex env set ENCRYPTION_SECRET "new-256-bit-hex-key" --prod

# 3. Better Auth secret
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)" --prod

# 4. Production API keys
npx convex env set RESEND_API_KEY "prod-resend-key" --prod
npx convex env set AUTUMN_SECRET_KEY "prod-autumn-key" --prod
```

---

## Step 4: Update Webhook Configuration

### 4.1 Register Production Webhook URL

1. **In Plaid Dashboard:**
   - Go to "Team Settings" → "Webhooks"
   - Add your production webhook URL: `https://yourdomain.com/api/plaid/webhook`
   - Enable webhook for "Transactions" product

2. **Test Webhook Delivery:**
   - Plaid will send a test webhook
   - Verify it arrives and is verified correctly

### 4.2 Webhook Implementation (Already Done ✅)

Your webhook handler is at `convex/http.ts` and already includes:
- ✅ Signature verification (`webhookVerification.ts`)
- ✅ Transaction sync handling
- ✅ Error handling

The webhook automatically adapts to production when `PLAID_ENV=production`.

---

## Step 5: Code Changes Required

### 5.1 NO Code Changes Needed! ✅

Your implementation already supports all environments:

```typescript
// All Plaid files automatically use process.env.PLAID_ENV
basePath: PlaidEnvironments[process.env.PLAID_ENV!]
```

Files that are already production-ready:
- ✅ `convex/plaid/linkToken.ts`
- ✅ `convex/plaid/exchangeToken.ts`
- ✅ `convex/plaid/syncTransactions.ts`
- ✅ `convex/plaid/webhookVerification.ts`

---

## Step 6: Testing Strategy

### 6.1 Sandbox Testing (Current State ✅)
- Already completed during development
- Used fake bank credentials

### 6.2 Development Environment Testing

Before going to production, test with **Development** credentials:

```bash
# Switch to development
npx convex env set PLAID_ENV "development"
npx convex env set PLAID_CLIENT_ID "dev-client-id"
npx convex env set PLAID_SECRET "dev-secret"
```

**Test with Real Banks:**
1. Use Plaid Link with your own bank account
2. Verify transactions sync correctly
3. Test transaction matching logic
4. Test webhook delivery
5. Verify rewards calculation

**Development Mode Limitations:**
- 100 Items (connected banks) per project
- Real bank data but Plaid won't charge you
- Full feature parity with production

### 6.3 Production Launch Testing

After deploying to production:

1. **Soft Launch:**
   - Start with internal team/beta users
   - Monitor Plaid logs and error rates
   - Check transaction matching accuracy

2. **Monitor Key Metrics:**
   - Link success rate (should be >95%)
   - Transaction sync latency
   - Webhook delivery success
   - Error rates in Convex logs

3. **Gradual Rollout:**
   - Phase 1: Internal team (1 week)
   - Phase 2: Beta users (2-4 weeks)
   - Phase 3: Public launch

---

## Step 7: Monitoring & Logging

### 7.1 Plaid Dashboard

Monitor in production:
- **API Usage:** Track API calls and rate limits
- **Webhook Logs:** View delivery status and failures
- **Error Codes:** Monitor for specific errors

### 7.2 Convex Logs

```bash
# View production logs
npx convex logs --prod

# Watch logs in real-time
npx convex logs --prod --watch
```

Watch for:
- Failed webhook verifications
- Transaction sync errors
- Rate limit warnings
- Access token issues

### 7.3 Set Up Alerts

1. **Plaid Webhook Failures:**
   - Plaid will email you about delivery failures
   - Set up retries in your webhook handler (already implemented)

2. **Convex Error Monitoring:**
   - Monitor error rates in Convex dashboard
   - Set up alerts for critical failures

---

## Step 8: Compliance & Legal Requirements

### 8.1 Privacy Policy Must Include:

- Mention of Plaid and data collection
- What transaction data you collect
- How you use transaction data
- User rights to disconnect/delete data
- Link to Plaid's End User Privacy Policy

**Example language:**
> "We use Plaid Technologies, Inc. to securely connect your bank account. By using our service, you agree to share your transaction data with us through Plaid. For more information about how Plaid handles your data, please review [Plaid's Privacy Policy](https://plaid.com/legal/#end-user-privacy-policy)."

### 8.2 Terms of Service Must Include:

- Clear explanation of automatic loyalty rewards
- User consent to transaction monitoring
- Right to disconnect bank accounts
- Data retention policies

### 8.3 User Consent Flow (Already Implemented ✅)

Your Plaid Link flow already:
- ✅ Shows Plaid's consent screen
- ✅ Explains data usage
- ✅ Gets explicit user consent

---

## Step 9: Security Best Practices

### 9.1 Access Token Security (Already Done ✅)

Your implementation already:
- ✅ Encrypts access tokens with AES-256-GCM
- ✅ Stores encrypted tokens in database
- ✅ Never exposes tokens to client
- ✅ Uses environment-based encryption keys

### 9.2 Production Security Checklist

- [ ] All secrets use production values (not reused from dev)
- [ ] HTTPS enabled on production domain
- [ ] Webhook endpoint uses signature verification
- [ ] Rate limiting enabled on API endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Convex authentication required for all user actions

---

## Step 10: Common Issues & Solutions

### Issue 1: "Invalid credentials" in Production

**Cause:** Using sandbox credentials with `PLAID_ENV=production`

**Solution:**
```bash
# Verify you're using production credentials
npx convex env list --prod
# Should show PLAID_ENV=production with matching production credentials
```

### Issue 2: Webhook Verification Failing

**Cause:** Webhook URL not registered in Plaid dashboard

**Solution:**
1. Go to Plaid Dashboard → Webhooks
2. Add `https://yourdomain.com/api/plaid/webhook`
3. Test webhook delivery

### Issue 3: Rate Limiting Errors

**Cause:** Exceeding Plaid API rate limits

**Solution:**
- Sandbox: 200 requests/min
- Development: 400 requests/min  
- Production: 600 requests/min (higher with approval)
- Implement exponential backoff for retries

### Issue 4: Link Token Creation Fails

**Cause:** Webhook URL not HTTPS in production

**Solution:**
```bash
# Ensure SITE_URL uses HTTPS
npx convex env set SITE_URL "https://yourdomain.com" --prod
```

---

## Step 11: Production Deployment Checklist

Use this as a final checklist before going live:

### Pre-Deployment
- [ ] Plaid production access approved
- [ ] Production credentials obtained from Plaid dashboard
- [ ] Privacy Policy published and includes Plaid language
- [ ] Terms of Service published
- [ ] Domain registered and SSL certificate active
- [ ] Production domain points to your hosting

### Convex Environment
- [ ] Production deployment created (`npx convex deploy --prod`)
- [ ] `PLAID_ENV=production` set
- [ ] Production `PLAID_CLIENT_ID` set
- [ ] Production `PLAID_SECRET` set
- [ ] Production `SITE_URL` set (HTTPS)
- [ ] New production `ENCRYPTION_SECRET` generated
- [ ] New production `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` set
- [ ] New production `BETTER_AUTH_SECRET` set
- [ ] Production `RESEND_API_KEY` set
- [ ] Production `AUTUMN_SECRET_KEY` set

### Plaid Dashboard
- [ ] Production webhook URL registered
- [ ] Webhook test passed
- [ ] "Transactions" product enabled for production
- [ ] Company profile complete

### Testing
- [ ] Tested with development environment and real banks
- [ ] Transaction sync works end-to-end
- [ ] Transaction matching logic validated
- [ ] Reward calculations accurate
- [ ] Webhook delivery confirmed
- [ ] Push notifications working

### Monitoring
- [ ] Plaid dashboard access confirmed
- [ ] Convex logs accessible (`npx convex logs --prod`)
- [ ] Error alerting configured
- [ ] Webhook failure alerts enabled

### Legal & Compliance
- [ ] Privacy Policy reviewed by legal (if applicable)
- [ ] Terms of Service reviewed
- [ ] User consent flow tested
- [ ] Data deletion process documented

---

## Quick Command Reference

```bash
# Check current environment
npx convex env list

# Switch to production
npx convex deploy --prod

# Set production Plaid credentials
npx convex env set PLAID_ENV "production" --prod
npx convex env set PLAID_CLIENT_ID "your-prod-id" --prod
npx convex env set PLAID_SECRET "your-prod-secret" --prod
npx convex env set SITE_URL "https://yourdomain.com" --prod

# View production logs
npx convex logs --prod --watch

# Test webhook (from Plaid dashboard)
# Go to: Dashboard → Webhooks → Test Webhook
```

---

## Next Steps After Going Live

1. **Week 1:** Monitor error rates and user feedback closely
2. **Week 2-4:** Iterate on transaction matching accuracy
3. **Month 1:** Review Plaid API usage and optimize sync frequency
4. **Month 2+:** Consider additional Plaid products (Identity, Balance)

---

## Support Resources

- **Plaid Support:** [https://support.plaid.com](https://support.plaid.com)
- **Plaid Status:** [https://status.plaid.com](https://status.plaid.com)
- **Plaid API Docs:** [https://plaid.com/docs/api/](https://plaid.com/docs/api/)
- **Convex Support:** [https://docs.convex.dev](https://docs.convex.dev)

---

## Estimated Timeline

- **Plaid Production Application:** 1-2 weeks
- **Production Setup & Testing:** 1-3 days
- **Internal Beta:** 1 week
- **Soft Launch:** 2-4 weeks
- **Full Production:** 4-8 weeks total

---

**Note:** Always test thoroughly in Development environment before deploying to Production. Once in production, start with a small user base and gradually scale.

