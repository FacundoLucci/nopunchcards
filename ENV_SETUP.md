<!-- Environment Setup Instructions -->
<!-- Generated: 2025-11-08T16:05:00Z -->

# Environment Variables Setup

## Current Status

### ✅ Convex Environment Variables (Backend) - ALL SET

All backend secrets are configured in Convex and ready to use:

```bash
✅ PLAID_CLIENT_ID=67528ce1c45170001aa885f9
✅ PLAID_SECRET=5618db9c54a02af60976065ba33da4
✅ PLAID_ENV=sandbox
✅ RESEND_API_KEY=re_5D3zJsQ3_5CEVY6BSYpDFzX9kUQKZ75PG
✅ AUTUMN_SECRET_KEY=am_sk_test_VdHgcqyFQ5AURAmdG01GpvX7I7NFH28o18CpqFqNmo
✅ VAPID_PUBLIC_KEY=BKBF0GzXagaN3_Y0WD6q9eC_zDVlT-cE56LMD8TKN1Nj0Oj-bNbSgRbOgBdHVXCk5L2IhoPf3TMUxmiF1bhaBkM
✅ VAPID_PRIVATE_KEY=9hKR3iyYiOSrUGrGMbKcNVnYH76uiWZqvxkwpTUUmYs
✅ ENCRYPTION_SECRET=08942636038ef53cb529f1b20a4fbd8641db141166a7ec522bd3a3dc33be89e4
✅ SITE_URL=http://localhost:3000
✅ BETTER_AUTH_SECRET=mdqdaBpGQO0sIU2dFNm0GBrL3q+bUe8B8VwNqKb3DxI (auto-generated)
```

You can verify these anytime with:
```bash
npx convex env list
```

### ⚠️ Client Environment Variables (.env.local) - ACTION REQUIRED

You need to create or update `.env.local` in the project root:

```bash
# .env.local

# Get this URL from the `npx convex dev` output
# It should be displayed when Convex starts
VITE_CONVEX_URL=https://lovely-deer-35.convex.cloud

# Use the same VAPID public key from Convex env (see above)
VITE_VAPID_PUBLIC_KEY=BKBF0GzXagaN3_Y0WD6q9eC_zDVlT-cE56LMD8TKN1Nj0Oj-bNbSgRbOgBdHVXCk5L2IhoPf3TMUxmiF1bhaBkM
```

**Important Notes:**
- `.env.local` is gitignored for security
- These values are bundled into the client-side code
- NEVER put secrets in .env.local (only public/client-safe values)
- The VITE_CONVEX_URL should match your actual Convex deployment

## How to Get Your VITE_CONVEX_URL

When you run `npx convex dev`, you'll see output like:

```
✔ Connected to cloud deployment https://lovely-deer-35.convex.cloud
```

Copy that URL to your .env.local file.

## Verify Everything Works

After creating .env.local:

1. **Restart the frontend dev server** (if it's already running):
   ```bash
   # Press Ctrl+C to stop, then restart
   pnpm dev
   ```

2. **Check the browser console** - Should see Convex connection messages

3. **Test authentication** - Sign up should work without errors

## Production Environment Variables

When deploying to production, you'll need separate values:

### Convex Production Deployment

```bash
# Switch to production deployment
npx convex deploy

# Set production secrets
npx convex env set PLAID_ENV "production" --prod
npx convex env set PLAID_CLIENT_ID "your-prod-client-id" --prod
npx convex env set PLAID_SECRET "your-prod-secret" --prod
npx convex env set SITE_URL "https://yourdomain.com" --prod

# Generate new keys for production
npx web-push generate-vapid-keys
npx convex env set VAPID_PUBLIC_KEY "..." --prod
npx convex env set VAPID_PRIVATE_KEY "..." --prod

# Generate new encryption key for production
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx convex env set ENCRYPTION_SECRET "..." --prod

# Production Resend and Autumn keys
npx convex env set RESEND_API_KEY "your-prod-key" --prod
npx convex env set AUTUMN_SECRET_KEY "your-prod-key" --prod
```

### Production .env.local

```bash
# Production frontend
VITE_CONVEX_URL=https://your-prod-deployment.convex.cloud
VITE_VAPID_PUBLIC_KEY=your-prod-vapid-public-key
```

## Security Notes

✅ **What's Safe in .env.local:**
- Convex deployment URL (public)
- VAPID public key (public)

❌ **NEVER put in .env.local:**
- API secrets (Plaid, Resend, Autumn)
- VAPID private key
- Encryption keys
- Auth secrets

All secrets are safely stored in Convex environment variables and only accessible server-side.

---

_Last updated: 2025-11-08T16:05:00Z_

