# Onboarding Error Handling Fix

**Date:** 2025-11-12

## Problem

When a user was authenticated but hadn't completed onboarding (no profile exists), queries using `requireRole()` would throw an error:

```
[CONVEX Q(businesses/queries:getMyBusinesses)] Server Error
Uncaught Error: Profile not found - user may need to complete onboarding
```

This created a poor user experience:
- ❌ Query errors crashed the component
- ❌ OnboardingGuard couldn't redirect because the error happened first
- ❌ User saw error messages instead of being smoothly redirected

## Solution

### 1. New Helper Function: `tryRequireRole()`

Created a graceful version of `requireRole()` that returns `null` instead of throwing when the profile is missing:

```typescript
// convex/users.ts

// Returns null if profile not found (instead of throwing)
export async function tryRequireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"consumer" | "business_owner" | "admin">
) {
  try {
    return await requireRole(ctx, allowedRoles);
  } catch (error: any) {
    if (error.message?.includes("Profile not found")) {
      return null; // Graceful handling
    }
    throw error; // Re-throw auth/permission errors
  }
}
```

### 2. Updated Queries to Handle Missing Profiles

**Before:**
```typescript
export const getMyBusinesses = query({
  handler: async (ctx) => {
    const user = await requireRole(ctx, ["business_owner"]);
    // ❌ Throws if no profile, crashes the query
    return await ctx.db.query("businesses")...
  },
});
```

**After:**
```typescript
export const getMyBusinesses = query({
  handler: async (ctx) => {
    const user = await tryRequireRole(ctx, ["business_owner"]);
    
    if (!user) {
      // ✅ Gracefully return empty array
      // OnboardingGuard will redirect user
      return [];
    }
    
    return await ctx.db.query("businesses")...
  },
});
```

## When to Use Each Function

### Use `requireRole()` for:
- ✅ **Mutations** (state-changing operations)
- ✅ **Queries that MUST have a profile** to function
- ✅ **Admin-only operations**

```typescript
export const createBusiness = mutation({
  handler: async (ctx, args) => {
    // Mutation should fail fast if unauthorized
    const user = await requireRole(ctx, ["business_owner"]);
    // ... create business
  },
});
```

### Use `tryRequireRole()` for:
- ✅ **List queries** that can return empty arrays
- ✅ **Dashboard queries** that should gracefully handle incomplete onboarding
- ✅ **Queries called before onboarding is complete**

```typescript
export const getMyItems = query({
  handler: async (ctx) => {
    const user = await tryRequireRole(ctx, ["consumer"]);
    
    if (!user) return []; // or null, depending on return type
    
    // ... fetch items
  },
});
```

## Flow with OnboardingGuard

Here's how the improved flow works:

1. **User logs in** → Authenticated but no profile
2. **Navigate to `/business`** → Business route loads
3. **Query `getMyBusinesses`** → Uses `tryRequireRole()`, returns `[]`
4. **OnboardingGuard checks** → Sees `needsOnboarding: true`
5. **Redirect to onboarding** → User completes onboarding
6. **Profile created** → Future queries work normally

✅ **No errors, smooth redirect!**

## Changes Made

### Files Modified:

1. **`convex/users.ts`**
   - Added `tryRequireRole()` helper function
   - Documented when to use each helper

2. **`convex/businesses/queries.ts`**
   - Updated `getMyBusinesses` to use `tryRequireRole()`
   - Returns `[]` when no profile exists
   - Updated `getDashboardStats` to use `tryRequireRole()` (but still throws if missing)

### Files Already Handling This Well:

- **`convex/onboarding/queries.ts`** - Already returns `needsOnboarding: true` when no profile
- **`src/components/OnboardingGuard.tsx`** - Properly redirects when onboarding needed

## Testing

To test the fix:

1. **Create a new user account** (sign up)
2. **Navigate directly to `/business`** (before completing onboarding)
3. **Expected behavior:**
   - ✅ No error shown
   - ✅ Smooth redirect to `/consumer/onboarding`
   - ✅ Query returns empty array temporarily

## Future Improvements

Consider applying this pattern to other queries:

```bash
# Find all queries using requireRole
grep -r "requireRole" convex/**/*.ts
```

Review each and decide if it should:
- Keep `requireRole()` (fail fast)
- Switch to `tryRequireRole()` (graceful degradation)

## Best Practices

### ✅ DO:
- Use `tryRequireRole()` in list/dashboard queries
- Return empty arrays or null when profile missing
- Let OnboardingGuard handle the redirect
- Document why you chose each approach

### ❌ DON'T:
- Use `tryRequireRole()` in mutations (should fail fast)
- Silently ignore missing profiles for critical data
- Mix error handling patterns in the same file

## Error Messages

### Before:
```
❌ Error: Profile not found - user may need to complete onboarding
```

### After:
```
✅ (No error - graceful redirect to onboarding)
```

---

**Last Updated:** 2025-11-12

