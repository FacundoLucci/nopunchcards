# Production Environment Variables Setup

**Last Updated**: 2025-11-17

## ✅ Convex Production Environment Variables - ALL SET

All environment variables have been successfully configured in your production Convex deployment (`watchful-kangaroo-858.convex.cloud`):

```bash
✅ SITE_URL=https://www.lasoloyalty.com
✅ PLAID_CLIENT_ID=67528ce1c45170001aa885f9
✅ PLAID_SECRET=5618db9c54a02af60976065ba33da4
✅ PLAID_ENV=sandbox
✅ RESEND_API_KEY=re_5D3zJsQ3_5CEVY6BSYpDFzX9kUQKZ75PG
✅ AUTUMN_SECRET_KEY=am_sk_test_VdHgcqyFQ5AURAmdG01GpvX7I7NFH28o18CpqFqNmo
✅ VAPID_PUBLIC_KEY=BKBF0GzXagaN3_Y0WD6q9eC_zDVlT-cE56LMD8TKN1Nj0Oj-bNbSgRbOgBdHVXCk5L2IhoPf3TMUxmiF1bhaBkM
✅ VAPID_PRIVATE_KEY=9hKR3iyYiOSrUGrGMbKcNVnYH76uiWZqvxkwpTUUmYs
✅ ENCRYPTION_SECRET=08942636038ef53cb529f1b20a4fbd8641db141166a7ec522bd3a3dc33be89e4
✅ BETTER_AUTH_SECRET=mdqdaBpGQO0sIU2dFNm0GBrL3q+bUe8B8VwNqKb3DxI (auto-generated)
```

## 🔄 Verify Environment Variables

You can verify the current environment variables at any time:

```bash
npx convex env list
```

## ⚠️ Important Notes for Production

### 1. Plaid Environment (Currently: Sandbox)

Your Plaid integration is currently set to **sandbox mode**. This is good for testing, but when you're ready for real banking connections, you'll need to:

1. **Apply for Production Access** with Plaid
2. **Get Production Credentials** from Plaid Dashboard
3. **Update Environment Variables**:
   ```bash
   npx convex env set PLAID_ENV "production"
   npx convex env set PLAID_CLIENT_ID "your-production-client-id"
   npx convex env set PLAID_SECRET "your-production-secret"
   ```

**Sandbox Mode Limitations:**
- Test accounts only (not real bank connections)
- Limited to Plaid's test banks
- No real transactions processed

### 2. Autumn Payment Processing (Currently: Test Mode)

Your Autumn secret key starts with `am_sk_test_` indicating **test mode**. For real payments:

1. **Get Production Key** from Autumn Dashboard
2. **Update Environment Variable**:
   ```bash
   npx convex env set AUTUMN_SECRET_KEY "am_sk_live_your-production-key"
   ```

### 3. Resend Email Service

Verify that your Resend API key is configured for production email sending:
- Check your sending limits in the Resend dashboard
- Verify your domain is configured for sending
- Set up proper SPF/DKIM records for deliverability

### 4. Push Notifications (VAPID Keys)

The current VAPID keys are shared between development and production. For better security in production, consider generating new production-only keys:

```bash
# Generate new VAPID keys
npx web-push generate-vapid-keys

# Set them in production
npx convex env set VAPID_PUBLIC_KEY "your-new-public-key"
npx convex env set VAPID_PRIVATE_KEY "your-new-private-key"
```

**Note:** If you change VAPID keys, existing push notification subscriptions will need to be re-registered.

## 🌐 Frontend Environment Variables (Netlify)

Netlify needs to know your production Convex URL. Set this in the Netlify dashboard:

### Via Netlify Dashboard:
1. Go to: https://app.netlify.com/sites/lasoloyalty/settings/deploys
2. Navigate to: Environment Variables
3. Add/Update:
   ```
   VITE_CONVEX_URL=https://watchful-kangaroo-858.convex.cloud
   VITE_VAPID_PUBLIC_KEY=BKBF0GzXagaN3_Y0WD6q9eC_zDVlT-cE56LMD8TKN1Nj0Oj-bNbSgRbOgBdHVXCk5L2IhoPf3TMUxmiF1bhaBkM
   ```

### Via Netlify CLI:
```bash
netlify env:set VITE_CONVEX_URL "https://watchful-kangaroo-858.convex.cloud"
netlify env:set VITE_VAPID_PUBLIC_KEY "BKBF0GzXagaN3_Y0WD6q9eC_zDVlT-cE56LMD8TKN1Nj0Oj-bNbSgRbOgBdHVXCk5L2IhoPf3TMUxmiF1bhaBkM"
```

After setting these, trigger a new deployment to apply the changes.

## 🔒 Security Best Practices

### ✅ Safe to Share (Public)
- `VITE_CONVEX_URL` - Your Convex deployment URL
- `VITE_VAPID_PUBLIC_KEY` - VAPID public key for push notifications
- `SITE_URL` - Your public website URL

### ❌ NEVER Share (Secrets)
- `PLAID_SECRET` - Plaid API secret
- `PLAID_CLIENT_ID` - Plaid client ID
- `RESEND_API_KEY` - Email API key
- `AUTUMN_SECRET_KEY` - Payment processing secret
- `VAPID_PRIVATE_KEY` - Push notification private key
- `ENCRYPTION_SECRET` - Database encryption key
- `BETTER_AUTH_SECRET` - Authentication secret

**All secrets are safely stored in Convex's encrypted environment variables and are only accessible server-side.**

## 📝 Quick Reference Commands

### View All Environment Variables
```bash
npx convex env list
```

### Set a Single Environment Variable
```bash
npx convex env set KEY_NAME "value"
```

### Remove an Environment Variable
```bash
npx convex env unset KEY_NAME
```

## 🚀 Deployment Workflow

When making changes to environment variables:

1. **Update Convex Environment Variables** (as shown above)
2. **Redeploy Convex Functions** (if code uses new variables):
   ```bash
   npx convex deploy
   ```
3. **Update Netlify Environment Variables** (for client-side changes)
4. **Trigger Netlify Rebuild** (if frontend needs the changes)

## 📊 Current Deployment Status

- **Production URL**: https://www.lasoloyalty.com
- **Convex Deployment**: `watchful-kangaroo-858.convex.cloud`
- **Plaid Mode**: Sandbox (update for production)
- **Autumn Mode**: Test (update for production)
- **Push Notifications**: Enabled
- **Email Service**: Configured

---

**Next Steps for Production:**
1. ✅ Environment variables configured
2. ⏳ Apply for Plaid production access (when ready for real banking)
3. ⏳ Get Autumn production keys (when ready for real payments)
4. ⏳ Consider generating production-specific VAPID keys
5. ⏳ Set Netlify environment variables
6. ⏳ Test all features in production

---

_Last updated: 2025-11-17_

