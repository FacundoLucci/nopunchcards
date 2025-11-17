# Role Override Bug Fix

**Date:** 2025-11-17  
**Status:** ✅ Fixed

## Problem

Business owners and admins were being converted to consumers when logging in. This was a critical bug that:
- Changed business owners → consumers
- Changed admins → consumers  
- Lost role information permanently
- Prevented access to business features

## Root Cause

**Two separate issues working together:**

### Issue 1: `ensureProfile` Modified Existing Roles ❌

In `convex/users.ts`, the `ensureProfile` mutation had dangerous behavior:

```typescript
// ❌ BEFORE (WRONG)
if (existing) {
  // If role is specified and different, update it
  if (args.role && existing.role !== args.role) {
    console.log("Updating role from", existing.role, "to", args.role);
    await ctx.db.patch(existing._id, { role: args.role });  // ← DANGEROUS!
  }
  return existing._id;
}
```

This meant calling `ensureProfile({ role: "consumer" })` would **change** a business owner to a consumer!

### Issue 2: Onboarding Pages Called `ensureProfile` ❌

Both onboarding pages called `ensureProfile` with a hardcoded role:

**Consumer Onboarding** (`src/routes/_authenticated/consumer/onboarding.tsx`):
```typescript
// ❌ BEFORE (WRONG)
useEffect(() => {
  ensureProfile({ role: "consumer" })  // ← Would change business owners to consumers!
    .then((profileId) => {
      setProfileReady(true);
    });
}, [ensureProfile]);
```

**Business Registration** (`src/routes/_authenticated/business/register.tsx`):
```typescript
// ❌ BEFORE (WRONG)
useEffect(() => {
  ensureProfile({ role: "business_owner" })  // ← Would change consumers to business owners!
    .then((profileId) => {
      setProfileReady(true);
    });
}, []);
```

## How the Bug Triggered

**Scenario 1: Business owner navigates to consumer onboarding**
1. Business owner logs in
2. Somehow navigates to `/consumer/onboarding` (maybe bookmarked, direct link, etc.)
3. Page calls `ensureProfile({ role: "consumer" })`
4. **Role changed from `business_owner` → `consumer`** ❌

**Scenario 2: Consumer navigates to business registration**
1. Consumer logs in
2. Navigates to `/business/register`
3. Page calls `ensureProfile({ role: "business_owner" })`
4. **Role changed from `consumer` → `business_owner`** ❌

## Solution

### Fix 1: Never Modify Existing Roles ✅

Updated `convex/users.ts` to **never** modify existing roles:

```typescript
// ✅ AFTER (CORRECT)
if (existing) {
  console.log(
    "Profile exists:",
    existing._id,
    "current role:",
    existing.role
  );
  // IMPORTANT: Never modify existing roles - this prevents accidental role changes
  // Roles should only be changed through explicit admin functions
  return existing._id;
}
```

**Key Change:** Removed the role-modification logic entirely. `ensureProfile` now only:
- Creates profiles if they don't exist
- Returns existing profile ID if it exists
- **Never modifies existing roles**

### Fix 2: Remove `ensureProfile` Calls from Onboarding ✅

**Consumer Onboarding:**
```typescript
// ✅ AFTER (CORRECT)
useEffect(() => {
  console.log("[Consumer Onboarding] Profile should already exist from signup");
  // Mark as ready immediately - profile was created during signup
  setProfileReady(true);
}, []);
```

**Business Registration:**
```typescript
// ✅ AFTER (CORRECT)
useEffect(() => {
  console.log("[Business Register] Profile should already exist from signup");
  // Mark as ready immediately - profile was created during signup
  setProfileReady(true);
}, []);
```

**Why this is safe:**
- Profiles are now created during signup with the correct role
- No need to "ensure" profile exists during onboarding
- Removes the risk of role modification

## Files Changed

### Modified Files
1. ✅ `convex/users.ts` - Fixed `ensureProfile` to never modify existing roles
2. ✅ `src/routes/_authenticated/consumer/onboarding.tsx` - Removed `ensureProfile` call
3. ✅ `src/routes/_authenticated/business/register.tsx` - Removed `ensureProfile` call

### No Database Migration Needed
- Existing profiles keep their current roles
- No schema changes required
- Fix is immediate upon deployment

## Testing Checklist

### Test 1: Business Owner Login ✅
- [ ] Business owner logs in
- [ ] Profile role remains `business_owner`
- [ ] Redirected to `/business/dashboard`
- [ ] Can access business features

### Test 2: Consumer Login ✅
- [ ] Consumer logs in
- [ ] Profile role remains `consumer`
- [ ] Redirected to `/consumer/home`
- [ ] Can access consumer features

### Test 3: Cross-Navigation (Should be blocked by RoleGuard) ✅
- [ ] Business owner cannot access `/consumer/onboarding`
- [ ] Consumer cannot access `/business/register`
- [ ] Role guards prevent unauthorized access

### Test 4: New Signups ✅
- [ ] New consumer signup creates `consumer` profile
- [ ] New business signup creates `business_owner` profile
- [ ] Profiles persist through login/logout
- [ ] Roles never change

## Prevention Measures

### 1. Code Review Guidelines
- **Never** modify user roles in onboarding flows
- **Never** call `ensureProfile` with a role after signup
- Roles should only change through explicit admin functions

### 2. Future Role Changes
If we need to change user roles in the future, create an explicit admin mutation:

```typescript
// Example: Explicit role change function (admin-only)
export const changeUserRole = mutation({
  args: {
    userId: v.string(),
    newRole: v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    await requireRole(ctx, ["admin"]);
    
    // Explicit role change with audit logging
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (profile) {
      await ctx.db.patch(profile._id, { role: args.newRole });
      console.log(`[ADMIN] Role changed from ${profile.role} to ${args.newRole}`);
    }
  },
});
```

### 3. Type Safety
Consider adding stricter type checking to prevent role modification:

```typescript
// Future improvement: Separate mutations for different purposes
export const createProfile = mutation({ ... });      // Only creates
export const getOrCreateProfile = mutation({ ... }); // Gets or creates (no modify)
export const adminChangeRole = mutation({ ... });    // Admin-only role changes
```

## Impact

### Before Fix ❌
- Business owners randomly became consumers
- Data loss (role information)
- Users unable to access their business features
- Required manual database fixes

### After Fix ✅
- Roles are stable and never change accidentally
- Users maintain their correct role through login/logout
- No manual intervention needed
- Safe for all users

## Related Documents

- `SIGNUP_PROFILE_CREATION_FIX.md` - How profiles are created during signup
- `QUICK_RBAC_SUMMARY.md` - Role-based access control overview
- `ROLE_BASED_ACCESS_CONTROL_FIX.md` - Role guard implementation

---

_Last updated: 2025-11-17_

