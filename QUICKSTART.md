<!-- Quick Start Guide -->
<!-- Generated: 2025-11-08 -->

# No Punch Cards - Quick Start Guide

## Prerequisites Checklist

- [x] Node 20+ installed
- [x] pnpm 9+ installed
- [x] All packages installed (`pnpm install` already run)
- [x] Convex environment variables set
- [ ] `.env.local` configured with client variables

## Step 1: Configure .env.local

Create or update `.env.local` in the project root:

```bash
# You'll get this URL when you run `npx convex dev`
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Use the same VAPID public key from Convex env
VITE_VAPID_PUBLIC_KEY=BKBF0GzXagaN3_Y0WD6q9eC_zDVlT-cE56LMD8TKN1Nj0Oj-bNbSgRbOgBdHVXCk5L2IhoPf3TMUxmiF1bhaBkM
```

## Step 2: Start Development Servers

Open two terminal windows:

**Terminal 1 - Convex Backend:**
```bash
cd /Users/facundo/repos/github/nopunchcards
pnpm dlx convex dev
```

This will:
- Start the Convex development server
- Generate TypeScript types from your schema
- Watch for changes to Convex functions
- Display your deployment URL (copy this to VITE_CONVEX_URL)

**Terminal 2 - Frontend:**
```bash
cd /Users/facundo/repos/github/nopunchcards
pnpm dev
```

This will start the TanStack Start dev server at http://localhost:3000

## Step 3: Push Autumn Pricing Config

In a third terminal:

```bash
cd /Users/facundo/repos/github/nopunchcards
npx atmn push
```

This syncs your pricing tiers (free/pro) with Autumn.

## Step 4: Create Your First User

1. Visit http://localhost:3000
2. Click "Start Earning Rewards"
3. Fill out signup form
4. You'll be redirected to consumer onboarding

## Step 5: Test Plaid Integration

1. On the onboarding page, click "Link Your Card"
2. Plaid Link modal will open
3. Select any bank from the list
4. Use Plaid sandbox credentials:
   - Username: `user_good`
   - Password: `pass_good`
5. Select an account
6. You should be redirected to the consumer dashboard

## Step 6: Create a Business Owner Account

### Option A: Via Convex Dashboard (Quick)

1. Open Convex dashboard: https://dashboard.convex.dev
2. Navigate to your deployment
3. Go to Data → `profiles` table
4. Find your profile (by userId)
5. Edit the `role` field to `"business_owner"`
6. Refresh your app

### Option B: Create New Account

1. Sign out
2. Sign up with a new email
3. Follow Option A to set role to business_owner

## Step 7: Register a Business

1. Navigate to http://localhost:3000/business/register
2. Complete the multistep form:
   - Business name (e.g., "Joe's Coffee")
   - Category (e.g., "Coffee")
   - Address (optional)
   - Description (optional)
3. You'll be redirected to the business dashboard

## Step 8: Create a Reward Program

1. From business dashboard, click "+ Create" or navigate to Programs
2. Click the FAB (+ button)
3. Complete the multistep form:
   - Program name: "5-Visit Punch Card"
   - Visits: 5
   - Reward: "Free medium coffee"
4. Review and submit

## Step 9: Verify Business (Manual Step)

For transactions to match:

1. Open Convex dashboard
2. Go to Data → `businesses` table
3. Find your business
4. Edit `status` to `"verified"`

## Step 10: Test Transaction Matching

### Option A: Wait for Real Transactions
If you linked a real Plaid account, transactions will sync automatically via webhooks.

### Option B: Manually Insert Test Transaction

In Convex dashboard → Functions:

```javascript
// Call internal.plaid.helpers.insertTransaction
{
  "plaidTransactionId": "test-tx-001",
  "userId": "your-user-id",
  "plaidAccountId": "your-plaid-account-id",
  "amount": 450,
  "currency": "USD",
  "merchantName": "Joe's Coffee",
  "date": "2025-11-08",
  "status": "unmatched"
}
```

Then call `internal.matching.processNewTransactions` with `{}` args.

## Step 11: Test Public Business Page

1. Note your business slug from the dashboard
2. Visit http://localhost:3000/join/{your-slug}
3. Should see the public business page
4. Test the share button
5. If not logged in, click "Start Earning Rewards" → should redirect to signup

## Troubleshooting

### "Not authenticated" errors
- Ensure both Convex dev and frontend dev servers are running
- Check that VITE_CONVEX_URL in .env.local matches your deployment
- Try clearing browser cookies and signing in again

### Plaid Link doesn't open
- Check browser console for errors
- Verify Plaid script is loading (check Network tab)
- Ensure PLAID_CLIENT_ID and PLAID_SECRET are set in Convex

### Transactions not syncing
- Check Convex logs for webhook errors
- Verify ENCRYPTION_SECRET is set (64 hex chars)
- Manually trigger sync via Convex dashboard Functions

### TypeScript errors
- Run `npx convex dev` to regenerate types
- Restart your TypeScript server in your editor
- Check that all imports are correct

### "Upgrade your plan" when creating programs
- This is Autumn billing working correctly!
- On free tier, you can only create 1 active program
- To test Pro tier, upgrade via the paywall dialog

## What's Working

✅ Complete database schema with indexes  
✅ Authentication with Better Auth + auto-profile creation  
✅ Plaid Link token generation  
✅ Plaid token exchange with encryption  
✅ Transaction sync from Plaid webhooks  
✅ Transaction matching engine with scoring  
✅ Reward progress calculation  
✅ Automated notifications (push + email)  
✅ Business registration with slug generation  
✅ Reward program CRUD with billing gates  
✅ Public business pages with SSR  
✅ Consumer dashboard with progress tracking  
✅ Business dashboard with stats  
✅ PWA configuration with offline support  

## What's Next

See `IMPLEMENTATION_SUMMARY.md` for:
- Complete file structure
- Architecture details
- Production deployment checklist
- Known limitations

## Quick Commands Reference

```bash
# Development
pnpm dev                  # Start frontend
pnpm dlx convex dev       # Start Convex backend

# Deployment
pnpm build                # Build for production
npx convex deploy         # Deploy to Convex production

# Autumn
npx atmn push             # Sync pricing config
npx atmn init             # Initialize Autumn (first time)

# Environment
npx convex env set KEY VALUE    # Set Convex env var
npx convex env list             # List all env vars
```

---

_Last updated: 2025-11-08_

