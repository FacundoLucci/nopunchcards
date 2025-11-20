# Autumn Free Plan Auto-Assignment - Quick Summary

**Date:** 2025-11-17

## What Was Fixed

### Problem 1: Users weren't automatically getting the free plan
**Solution:** Created automatic free plan assignment that runs:
- ✅ After signup (new users)
- ✅ After login (existing users)

### Problem 2: Upgrade page allowed selecting the free plan
**Solution:** Updated upgrade page to:
- ✅ Hide free plan from selection (users already have it)
- ✅ Only show free plan when user is downgrading from premium
- ✅ Disable free plan button if user doesn't have premium

## Files Changed

### New Files
- `convex/users/ensureFreePlan.ts` - Helper that assigns free plan if user doesn't have one

### Modified Files
- `convex/users/signup.ts` - Calls helper after creating profile
- `src/routes/app.tsx` - Calls helper after login
- `src/routes/_authenticated/upgrade.tsx` - Filters/disables free plan selection

## How It Works

```typescript
// New mutation in convex/users/ensureFreePlan.ts
export const ensureUserHasFreePlan = mutation({
  handler: async (ctx) => {
    // 1. Check if user has any plan via Autumn
    const customer = await ctx.runQuery(autumnQuery, {});
    
    if (customer?.products?.length > 0) {
      return { hadPlan: true, assignedFreePlan: false };
    }
    
    // 2. If no plan, assign free plan
    await ctx.runMutation(attach, { productId: "free" });
    
    return { hadPlan: false, assignedFreePlan: true };
  }
});
```

## Testing

### New User Flow
1. Sign up → Profile created → Free plan assigned ✅
2. Navigate to upgrade page → Only see premium plans ✅

### Existing User Flow
1. Login → Free plan assigned if missing ✅
2. Navigate to upgrade page → Only see premium plans ✅

### Premium User Flow
1. Login → Keep premium plan ✅
2. Navigate to upgrade page → See premium plans + downgrade to free ✅

## Key Features

- **Non-blocking:** Errors don't prevent signup/login
- **Idempotent:** Safe to call multiple times
- **Automatic:** No user action required
- **Backwards compatible:** Fixes existing users

## Autumn Integration

Using the Autumn Convex API:
- `autumn.query()` - Check current subscriptions
- `autumn.attach({ productId: "free" })` - Assign free plan

Product ID from `autumn.config.ts`:
```typescript
export const free = product({
  id: "free",
  name: "Free",
  items: [
    featureItem({
      feature_id: rewardPrograms.id,
      included_usage: 1, // 1 active program
    }),
    featureItem({
      feature_id: monthlyCustomers.id,
      included_usage: 50, // 50 customers/month
      interval: "month",
    }),
  ],
});
```

---

See `FREE_PLAN_AUTO_ASSIGNMENT.md` for detailed documentation.

