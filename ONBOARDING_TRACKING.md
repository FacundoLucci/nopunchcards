# User Onboarding Tracking Implementation

_Created: 2025-11-09_

## Overview

Implemented a comprehensive onboarding tracking system for consumers to ensure users complete the credit card linking step before accessing the main application features.

## What Was Implemented

### 1. Database Schema Changes

**File**: `convex/schema.ts`

Added `onboarding` field to the `profiles` table:

```typescript
onboarding: v.optional(
  v.object({
    hasLinkedCard: v.boolean(),
    completedAt: v.optional(v.number()),
  })
)
```

This tracks:
- Whether the user has linked their credit card (`hasLinkedCard`)
- When they completed onboarding (`completedAt`)

### 2. Backend Queries & Mutations

**Files**:
- `convex/onboarding/queries.ts` - Query to check onboarding status
- `convex/onboarding/mutations.ts` - Mutation to update onboarding status

#### `getOnboardingStatus` Query

Returns the current user's onboarding status:

```typescript
{
  isComplete: boolean,        // Overall onboarding completion
  hasLinkedCard: boolean,     // Card linking status
  needsOnboarding: boolean,   // Whether user needs to complete onboarding
  completedAt?: number        // Timestamp when completed
}
```

#### `markCardLinked` Mutation

Called automatically when a user successfully links their card via Plaid. Updates the profile with:
- `hasLinkedCard: true`
- `completedAt: Date.now()`

### 3. Plaid Integration Update

**File**: `convex/plaid/exchangeToken.ts`

Updated the `exchangePublicToken` action to automatically mark onboarding as complete after a successful card link:

```typescript
// 6. Mark onboarding as complete (user has linked their card)
await ctx.runMutation(internal.onboarding.mutations.markCardLinked, {});
```

### 4. UI Components

**File**: `src/components/OnboardingProgress.tsx`

Created a flexible onboarding progress component with two modes:

#### Compact Mode (for banners)
Shows a small banner prompting users to complete setup:
```tsx
<OnboardingProgress 
  hasLinkedCard={false} 
  isComplete={false} 
  compact 
/>
```

#### Full Mode (for cards)
Shows detailed onboarding steps with progress tracking.

### 5. Route Protection

**File**: `src/routes/_authenticated/consumer/_layout.tsx`

Created a consumer layout route that:
1. Checks onboarding status server-side before loading any consumer route
2. Redirects to `/consumer/onboarding` if onboarding is incomplete
3. Allows the onboarding page itself to load without redirect

```typescript
export const Route = createFileRoute("/_authenticated/consumer/_layout")({
  ssr: true,
  beforeLoad: async ({ location }) => {
    // Skip check if already on onboarding page
    if (location.pathname === "/consumer/onboarding") {
      return {};
    }

    const onboardingStatus = await checkOnboarding();

    // Redirect if onboarding not complete
    if (onboardingStatus && onboardingStatus.needsOnboarding) {
      throw redirect({ to: "/consumer/onboarding" });
    }

    return {};
  },
  component: ConsumerLayoutRoute,
});
```

### 6. Route Structure Update

Restructured consumer routes to use the new layout:

**Before**:
```
/src/routes/_authenticated/consumer/
  - dashboard.tsx
  - merchants.tsx
  - notifications.tsx
  - rewards/index.tsx
  - onboarding.tsx
```

**After**:
```
/src/routes/_authenticated/consumer/
  - _layout.tsx              (layout with onboarding check)
  - _layout/
    - dashboard.tsx          (protected)
    - merchants.tsx          (protected)
    - notifications.tsx      (protected)
    - rewards/index.tsx      (protected)
  - onboarding.tsx           (unprotected, outside layout)
```

### 7. Dashboard Integration

**File**: `src/routes/_authenticated/consumer/_layout/dashboard.tsx`

Added onboarding status display on the dashboard:

```typescript
const onboardingStatus = useQuery(api.onboarding.queries.getOnboardingStatus, {});

// Shows compact banner if onboarding is incomplete
{onboardingStatus && !onboardingStatus.isComplete && (
  <OnboardingProgress
    hasLinkedCard={onboardingStatus.hasLinkedCard}
    isComplete={onboardingStatus.isComplete}
    compact
  />
)}
```

## User Flow

### New User Experience

1. **Sign Up** → User creates account
2. **Auto-redirect** → Sent to dashboard
3. **Onboarding Check** → Layout detects incomplete onboarding
4. **Redirect to Onboarding** → `/consumer/onboarding`
5. **Link Card** → User connects via Plaid
6. **Mark Complete** → `markCardLinked` mutation updates profile
7. **Access Dashboard** → User can now access all consumer features

### Existing User (Onboarding Complete)

1. **Sign In** → User logs in
2. **Onboarding Check** → Layout detects complete onboarding
3. **Access Dashboard** → User goes directly to dashboard
4. **No Banner** → OnboardingProgress component doesn't render

### Existing User (Onboarding Incomplete)

1. **Sign In** → User logs in
2. **Onboarding Check** → Layout detects incomplete onboarding
3. **Redirect to Onboarding** → Forced to complete setup
4. **Dashboard shows banner** → If they somehow bypass, banner prompts completion

## Key Features

✅ **Server-Side Checks** - Onboarding status verified server-side for security  
✅ **Automatic Redirect** - Users can't access consumer features without linking card  
✅ **Progress Tracking** - Visual feedback on onboarding completion  
✅ **Flexible UI** - Compact and full modes for different contexts  
✅ **Type-Safe** - Full TypeScript support with Convex validators  
✅ **Seamless Integration** - Automatic marking on successful Plaid link

## Future Enhancements

Possible additions:
- Multi-step onboarding (email verification, profile completion, etc.)
- Business owner onboarding flow
- Analytics tracking for onboarding completion rates
- Onboarding skip option with limitations
- Reminder notifications for incomplete onboarding

## Testing Checklist

- [ ] New user signup redirects to onboarding
- [ ] Cannot access dashboard without linking card
- [ ] Card linking marks onboarding complete
- [ ] Can access all features after onboarding
- [ ] Onboarding page accessible even when incomplete
- [ ] Banner shows on dashboard when incomplete
- [ ] Banner hides when onboarding complete
- [ ] Server-side redirect works (no flash of unauthorized content)

## Files Changed

### Backend (Convex)
- `convex/schema.ts` - Added onboarding field
- `convex/onboarding/queries.ts` - New query
- `convex/onboarding/mutations.ts` - New mutation
- `convex/plaid/exchangeToken.ts` - Updated to mark complete

### Frontend (React)
- `src/components/OnboardingProgress.tsx` - New component
- `src/routes/_authenticated/consumer/_layout.tsx` - New layout route
- `src/routes/_authenticated/consumer/_layout/dashboard.tsx` - Updated
- `src/routes/_authenticated/consumer/_layout/merchants.tsx` - Moved
- `src/routes/_authenticated/consumer/_layout/notifications.tsx` - Moved
- `src/routes/_authenticated/consumer/_layout/rewards/index.tsx` - Moved

---

_Last updated: 2025-11-09_

