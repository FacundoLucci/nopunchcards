# Free Plan Auto-Assignment

**Last Updated:** 2025-11-17

## Overview

This document describes the implementation of automatic free plan assignment via Autumn for all users (both new and existing).

## Problem

Users were not automatically getting the free plan assigned when they signed up, and the upgrade page allowed business users to select the free plan even though they should already have it.

## Solution

### 1. Automatic Free Plan Assignment

**New Helper Function:** `convex/users/ensureFreePlan.ts`

This mutation checks if a user has any Autumn subscription plan, and if not, automatically assigns the free plan. It's designed to be:
- Non-blocking: Won't fail the signup/login process if it errors
- Idempotent: Safe to call multiple times
- Logged: Provides clear console output for debugging

**Integration Points:**

1. **Signup Flow** (`convex/users/signup.ts`)
   - After creating a new user profile, automatically calls `ensureUserHasFreePlan`
   - Ensures all new users start with the free plan

2. **Login Flow** (`src/routes/app.tsx`)
   - After successful login, checks and assigns free plan if needed
   - Catches existing users who signed up before this feature was implemented
   - Non-blocking: Login succeeds even if plan assignment fails

### 2. Upgrade Page Fixes

**File:** `src/routes/_authenticated/upgrade.tsx`

**Changes:**

1. **Filtering Logic:**
   - Free plan is only shown if:
     - It's the user's current active plan (for display purposes)
     - User is downgrading from a premium plan
   - Otherwise, free plan is hidden from the pricing table

2. **Button Disabling:**
   - Free plan button is disabled if user doesn't have premium
   - Prevents users from "selecting" a plan they already have

**Code:**
```typescript
// Filter out free plan unless appropriate
.filter((product) => {
  const isFree = product.properties.is_free;
  const isActive = product.scenario === "active";
  const isDowngrade = product.scenario === "downgrade";
  
  // Only show free plan if:
  // 1. It's currently active (show as current plan)
  // 2. User is downgrading from premium (allow downgrade)
  if (isFree) {
    return isActive || (isDowngrade && hasPremium);
  }
  
  return true; // Show all non-free plans
})
```

## Architecture

### Flow Diagram

```
┌─────────────┐
│   Signup    │
└──────┬──────┘
       │
       ├─► Create Better Auth Account
       │
       ├─► Create Convex Profile
       │
       └─► ensureUserHasFreePlan() ────┐
                                       │
┌─────────────┐                       │
│    Login    │                       │
└──────┬──────┘                       │
       │                              │
       ├─► Authenticate               │
       │                              │
       └─► /app redirect ─────────────┤
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │  Check Autumn Plan     │
                          │  via autumn.query()    │
                          └───────────┬────────────┘
                                      │
                          ┌───────────┴────────────┐
                          │                        │
                      Has Plan              No Plan Found
                          │                        │
                    Return true           Call autumn.attach()
                                         with productId: "free"
```

### Files Modified

1. **New Files:**
   - `convex/users/ensureFreePlan.ts` - Helper mutation for plan assignment

2. **Modified Files:**
   - `convex/users/signup.ts` - Calls `ensureUserHasFreePlan` after profile creation
   - `src/routes/app.tsx` - Calls `ensureUserHasFreePlan` on login
   - `src/routes/_authenticated/upgrade.tsx` - Filters and disables free plan selection

## Autumn Integration

### Product Configuration

From `autumn.config.ts`:
```typescript
export const free = product({
  id: "free",
  name: "Free",
  items: [
    featureItem({
      feature_id: rewardPrograms.id,
      included_usage: 1, // 1 active program max
    }),
    featureItem({
      feature_id: monthlyCustomers.id,
      included_usage: 50, // 50 customers per month
      interval: "month",
    }),
  ],
});
```

### Autumn API Usage

**Query Customer:** `autumn.query()`
- Returns customer object with subscribed products
- Used to check if user has any plan

**Attach Product:** `autumn.attach({ productId: "free" })`
- Assigns a product to the authenticated customer
- Used to assign free plan to users without one

## Error Handling

All plan assignment operations are wrapped in try-catch blocks:
- Signup succeeds even if plan assignment fails
- Login succeeds even if plan assignment fails
- Errors are logged but don't block user flows
- Plans can be manually assigned later if automatic assignment fails

## Testing Checklist

- [ ] New user signup assigns free plan automatically
- [ ] Existing user login assigns free plan if they don't have one
- [ ] Upgrade page doesn't show free plan for users already on free plan
- [ ] Upgrade page shows free plan when downgrading from premium
- [ ] Free plan button is disabled for users already on free plan
- [ ] Premium users can see and select premium plans
- [ ] Downgrade from premium to free works correctly

## Future Enhancements

Potential improvements:
1. Add UI indicator showing "You're on the Free plan"
2. Show upgrade prompts when users hit free plan limits
3. Add analytics to track plan upgrade conversions
4. Implement plan change history in user settings

## Rollback Plan

If issues arise, you can:
1. Remove the `ensureUserHasFreePlan` call from `signup.ts` and `app.tsx`
2. Revert the filtering logic in `upgrade.tsx` to show all plans
3. Manually assign plans via Autumn dashboard

The helper function `ensureFreePlan.ts` can remain as it's only called explicitly.

---

_Last updated: 2025-11-17_

