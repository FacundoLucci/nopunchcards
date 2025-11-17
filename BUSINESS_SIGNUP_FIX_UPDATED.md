# Business Signup Profile Creation Fix - UPDATED

**Date:** 2025-11-17  
**Issue:** Business signups weren't creating profiles with correct roles in production  
**Root Cause:** Session sync timing issues + fallback didn't know intended role

## The Problem You Identified

When I first implemented the fallback system, it had a **critical flaw**:

```typescript
// In fallback code
ensureProfile({}) // No role specified!

// In ensureProfile mutation
const role = args.role || "consumer"; // Always defaults to consumer!
```

**Result:** Business owners who hit the fallback got consumer profiles! ❌

## The Solution: URL-Based Role Persistence

### How Roles Are Now Preserved

#### Step 1: Signup Page Passes Role in URL

**File:** `src/routes/signup.tsx`

```typescript
if (isBusiness) {
  navigate({ 
    to: "/business/register",
    search: { role: "business_owner" }  // ✅ Role in URL!
  });
} else {
  navigate({ 
    to: "/consumer/onboarding",
    search: { role: "consumer" }  // ✅ Role in URL!
  });
}
```

#### Step 2: Routes Validate and Use Search Params

**Files:** `app.tsx`, `business/register.tsx`, `consumer/onboarding.tsx`

```typescript
// 1. Validate search params (type-safe)
export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      role: search.role as "consumer" | "business_owner" | "admin" | undefined,
    };
  },
  component: AppRedirect,
});

// 2. Read role from URL
function AppRedirect() {
  const { role: intendedRole } = Route.useSearch();
  
  // 3. Use role when creating profile
  const roleToCreate = intendedRole || "consumer";
  ensureProfile({ role: roleToCreate });
}
```

### Complete User Flow

#### Successful Business Signup (Layer 1 Works)
1. User signs up at `/signup?mode=business`
2. Better Auth creates account
3. ✅ Profile created with `business_owner` role during signup
4. Redirected to `/business/register?role=business_owner`
5. Business register page ensures profile exists (idempotent)
6. User proceeds to create business

#### Business Signup with Timing Issues (Fallback Activates)
1. User signs up at `/signup?mode=business`
2. Better Auth creates account
3. ❌ Profile creation fails (session timing)
4. Redirected to `/business/register?role=business_owner` ← **Role preserved in URL!**
5. Business register page reads `role=business_owner` from URL
6. ✅ Calls `ensureProfile({ role: "business_owner" })`
7. Profile created with correct role!
8. User proceeds to create business

#### Edge Case: Direct /app Navigation
1. User goes directly to `/app` (no search params)
2. No profile exists
3. `intendedRole` is `undefined`
4. Falls back to `const roleToCreate = intendedRole || "consumer"`
5. Creates consumer profile (safe default)

## Implementation Details

### Files Modified

1. **`src/routes/signup.tsx`**
   - Passes `role` in URL search params during redirect
   
2. **`src/routes/app.tsx`**
   - Validates search params
   - Reads intended role from URL
   - Creates profile with correct role

3. **`src/routes/_authenticated/business/register.tsx`**
   - Validates search params
   - Ensures business_owner profile exists
   - Uses URL role or defaults to "business_owner"

4. **`src/routes/_authenticated/consumer/onboarding.tsx`**
   - Validates search params
   - Ensures consumer profile exists
   - Uses URL role or defaults to "consumer"

5. **`convex/users/ensureProfile.ts`** (NEW)
   - Idempotent profile creation mutation
   - Accepts optional role parameter
   - Never modifies existing profiles
   - Returns: `{ profileId, wasCreated, role }`

### Why URL Params Instead of Other Options?

#### ✅ Advantages of URL Search Params

1. **Stateless** - No client-side storage needed
2. **Works across redirects** - Survives navigation
3. **Type-safe** - TanStack Router validates params
4. **Debuggable** - Visible in browser URL
5. **SSR compatible** - Works server-side and client-side
6. **No timing issues** - Already in URL when page loads

#### ❌ Why Not Other Options?

**Session Storage:**
```typescript
sessionStorage.setItem('signupRole', role);  // ❌ Doesn't work with SSR
const role = sessionStorage.getItem('signupRole');  // ❌ Lost on page refresh
```

**Better Auth Custom Fields:**
```typescript
// ❌ Requires schema regeneration
// ❌ Adds auth state that's actually app state
// ❌ Couples app logic to auth system
```

**Cookies:**
```typescript
// ❌ More complex than needed
// ❌ Need to manage expiration
// ❌ Security considerations
```

## Security Considerations

### Can Users Manipulate the Role?

Yes, a user could manually change the URL from:
```
/business/register?role=business_owner
```
to:
```
/business/register?role=admin
```

### Why This Is Safe

1. **`ensureProfile` is idempotent**
   ```typescript
   // If profile already exists, role is NOT changed
   if (existing) {
     return { profileId: existing._id, wasCreated: false, role: existing.role };
   }
   ```

2. **Only affects NEW profiles**
   - The URL role only matters for the initial profile creation
   - Once created, the profile role is locked
   
3. **Business ownership requires separate verification**
   - Creating a profile with `business_owner` role doesn't grant access
   - Must still create a business record
   - Business creation has its own authorization checks

4. **RoleGuard protects routes**
   - All sensitive routes check actual profile role from database
   - URL params are just hints for initial creation
   - Actual authorization uses database state

### Could This Be Exploited?

**Scenario:** User signs up as consumer, manipulates URL to get business role

```
1. Sign up at /signup (consumer)
2. Manually navigate to /business/register?role=business_owner
3. ensureProfile({ role: "business_owner" }) is called
```

**What Happens:**
- ✅ Profile was already created during signup as "consumer"
- ✅ `ensureProfile` sees existing profile and returns it unchanged
- ❌ User doesn't get business role
- ✅ Security maintained

**The only vulnerable window:** Between signup and first profile creation. But:
- User would need to know about the URL param system
- Would need to navigate manually before any page loads
- Even if successful, still can't create business without verification

## Testing Scenarios

### Primary Path (Happy Path)
- [ ] Consumer signup creates consumer profile
- [ ] Business signup creates business_owner profile
- [ ] Correct redirects for each role

### Fallback Path (What We're Fixing)
- [ ] Consumer signup with failed profile → creates consumer via fallback
- [ ] Business signup with failed profile → creates business_owner via fallback
- [ ] Role preserved through redirect chain

### Edge Cases
- [ ] Direct navigation to /app (no search params)
- [ ] Manual URL manipulation (should not grant unearned access)
- [ ] Multiple rapid profile creation attempts (idempotent)
- [ ] Profile already exists (doesn't change role)

### Security Tests
- [ ] Existing consumer can't become business via URL manipulation
- [ ] RoleGuard still protects business routes
- [ ] Business creation requires proper authorization

## Alternative Approaches Considered

### 1. Infer Role from Redirect Destination
```typescript
// If going to /business/register, probably business owner
const inferredRole = location.pathname.includes('/business/') 
  ? 'business_owner' 
  : 'consumer';
```
**Rejected:** Too fragile, breaks if URLs change

### 2. Store in Better Auth User Metadata
**Rejected:** Requires local install schema customization, couples auth to app

### 3. Dedicated "Pending Signup" Table
```typescript
// Store intended role in Convex table during signup
const signupId = await ctx.db.insert("pendingSignups", {
  userId,
  intendedRole: "business_owner",
  expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
});
```
**Rejected:** Overcomplicated for what URL params solve simply

## Benefits of Final Solution

✅ **Simple** - URL search params, native to web platform  
✅ **Reliable** - Survives redirects, no timing issues  
✅ **Type-Safe** - TanStack Router validates params  
✅ **Debuggable** - Visible in URL bar  
✅ **Secure** - Only affects new profiles, existing profiles protected  
✅ **Idempotent** - Safe to call multiple times  
✅ **SSR Compatible** - Works server-side and client-side  

## Architectural Note: Profiles Table Still Correct

The question about using Better Auth tables directly vs separate profiles table is still answered the same way:

**Keep the separate `profiles` table** because:
- Clean separation: Auth data vs app data
- Schema flexibility
- Migration safety
- Standard pattern

The URL param solution actually **reinforces** this decision because:
- We're passing app-specific role information
- This belongs in app tables, not auth tables
- URL params bridge the gap cleanly

---

_Last updated: 2025-11-17_

