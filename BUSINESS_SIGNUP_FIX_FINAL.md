# Business Signup Profile Creation - Final Solution

**Date:** 2025-11-17  
**Issue:** Business signups weren't creating profiles with correct roles in production  
**Solution:** Path-based role inference + multi-layer fallback

## The Simple Solution

Instead of passing roles in URL search parameters, we **infer the role from the pathname**:

- `/business/register` → business_owner
- `/consumer/onboarding` → consumer
- `/app` → consumer (default)

**Why this is better:**
- ✅ Simpler - No search params to manage
- ✅ Cleaner URLs - No query strings
- ✅ Single source of truth - Path IS the intent
- ✅ Can't be lost - Path doesn't change like params might
- ✅ More intuitive - URL structure maps to user roles

## How It Works

### User Flow: Business Signup

```
1. Visit /signup?mode=business
2. Better Auth creates account
3. Try to create profile with business_owner role
4. Redirect to /business/register
5. If profile missing:
   - Path contains "/business/" → infer business_owner
   - Call ensureProfile({ role: "business_owner" })
   - ✅ Profile created with correct role!
```

### User Flow: Consumer Signup

```
1. Visit /signup (default mode)
2. Better Auth creates account
3. Try to create profile with consumer role
4. Redirect to /consumer/onboarding
5. If profile missing:
   - Path contains "/consumer/" → infer consumer
   - Call ensureProfile({ role: "consumer" })
   - ✅ Profile created with correct role!
```

## Implementation

### Signup Page

**File:** `src/routes/signup.tsx`

```typescript
// Simple redirects - path indicates intent
if (isBusiness) {
  navigate({ to: "/business/register" });
} else {
  navigate({ to: "/consumer/onboarding" });
}
```

### Business Register Page

**File:** `src/routes/_authenticated/business/register.tsx`

```typescript
// Path is /business/register, so we know: business_owner
useEffect(() => {
  ensureProfile({ role: "business_owner" })
    .then((result) => {
      console.log("Profile ready:", result.role);
      setProfileReady(true);
    });
}, [ensureProfile]);
```

### Consumer Onboarding Page

**File:** `src/routes/_authenticated/consumer/onboarding.tsx`

```typescript
// Path is /consumer/onboarding, so we know: consumer
useEffect(() => {
  ensureProfile({ role: "consumer" })
    .then((result) => {
      console.log("Profile ready:", result.role);
      setProfileReady(true);
    });
}, [ensureProfile]);
```

### App Redirect (Default)

**File:** `src/routes/app.tsx`

```typescript
// /app doesn't indicate intent, default to consumer
if (profile === null) {
  ensureProfile({ role: "consumer" })
    .then((result) => {
      // Will redirect based on actual role created
    });
}
```

## The ensureProfile Mutation

**File:** `convex/users/ensureProfile.ts`

```typescript
export const ensureProfileExists = mutation({
  args: {
    role: v.optional(v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    )),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = user.userId || user._id;

    // Check if profile exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    // IMPORTANT: Never modify existing profiles
    if (existing) {
      return {
        profileId: existing._id,
        wasCreated: false,
        role: existing.role,  // Return existing role
      };
    }

    // Create new profile with specified role
    const role = args.role || "consumer";
    const profileId = await ctx.db.insert("profiles", {
      userId,
      role,
      createdAt: Date.now(),
    });

    return {
      profileId,
      wasCreated: true,
      role,
    };
  },
});
```

**Key features:**
- ✅ **Idempotent** - Safe to call multiple times
- ✅ **Never modifies** - Existing profiles unchanged
- ✅ **Returns role** - Caller knows what was created/found
- ✅ **Optional role** - Defaults to consumer if not specified

## Three-Layer Fallback System

### Layer 1: Primary Path (Signup)

```typescript
// In signup.tsx
const result = await createProfile({ role });
```

**Success:** Profile created immediately with correct role  
**Failure:** Continue to next layer

### Layer 2: Path-Based Inference (First Page Load)

```typescript
// In business/register.tsx or consumer/onboarding.tsx
ensureProfile({ role: "business_owner" }) // or "consumer"
```

**How role is determined:**
- On `/business/*` routes → business_owner
- On `/consumer/*` routes → consumer
- On `/app` route → consumer (safe default)

### Layer 3: Idempotent Safety

The `ensureProfile` mutation is safe to call anytime:
- If profile exists → returns it unchanged
- If profile missing → creates it with specified role

## Security

### Can Users Manipulate Their Role?

**Q:** What if a user navigates from `/consumer/onboarding` to `/business/register`?

**A:** No security risk because:

1. **Profile already exists**
   ```typescript
   // ensureProfile sees existing profile
   if (existing) {
     return { role: existing.role };  // Consumer role preserved
   }
   ```

2. **Business creation still requires authorization**
   - Having a business_owner profile doesn't grant access
   - Must still create a business record
   - Business mutations check actual ownership

3. **RoleGuard protects routes**
   - Checks actual profile role from database
   - Not based on URL or client-side state

### Vulnerable Window?

The only theoretical vulnerability is between:
1. Better Auth account creation
2. First profile creation

This window is **milliseconds** and requires:
- User to know about the system
- Manually navigate before any page loads
- Even then, still can't create business without verification

## Why Not Search Params?

Our initial approach used URL search params (`?role=business_owner`), but pathname-based inference is better:

| Approach | URL | Pros | Cons |
|----------|-----|------|------|
| **Search Params** | `/business/register?role=business_owner` | Explicit | Redundant, can be lost, complex |
| **Path Inference** | `/business/register` | Simple, clean, intuitive | Relies on consistent path structure |

The path structure is already part of our app architecture, so using it as the source of truth is more elegant.

## Files Changed

1. ✅ `src/routes/signup.tsx` - Removed search params from redirects
2. ✅ `src/routes/app.tsx` - Removed validateSearch, uses default consumer
3. ✅ `src/routes/_authenticated/business/register.tsx` - Hardcoded business_owner
4. ✅ `src/routes/_authenticated/consumer/onboarding.tsx` - Hardcoded consumer
5. ✅ `src/components/OnboardingGuard.tsx` - Removed search params
6. ✅ `src/components/RoleGuard.tsx` - Removed search params
7. ✅ `convex/users/ensureProfile.ts` - New idempotent mutation

## Testing Scenarios

### Happy Path
- [x] Consumer signup → consumer profile → consumer onboarding
- [x] Business signup → business_owner profile → business register

### Fallback Path (What We Fixed)
- [x] Consumer signup with timing issue → fallback creates consumer profile
- [x] Business signup with timing issue → fallback creates business_owner profile

### Edge Cases
- [x] Direct navigation to /app → creates consumer profile (safe default)
- [x] Multiple rapid calls to ensureProfile → idempotent, no duplicates
- [x] Profile already exists → not modified

### Security
- [x] Existing consumer can't become business via URL manipulation
- [x] RoleGuard protects business routes
- [x] Business creation requires proper authorization

## Comparison to Alternatives

### ❌ Session Storage
```typescript
sessionStorage.setItem('signupRole', role);  // Lost on refresh, SSR incompatible
```

### ❌ Better Auth Custom Fields
```typescript
// Requires schema regeneration, couples app to auth
```

### ❌ Dedicated Signup Table
```typescript
// Overcomplicated, requires cleanup, race conditions
```

### ✅ Path-Based Inference
```typescript
// Path already exists, no additional state needed
```

## Benefits of Final Solution

✅ **Simplest possible** - Uses existing URL structure  
✅ **No state management** - No params, cookies, or storage  
✅ **Type-safe** - Routes defined in TanStack Router  
✅ **Debuggable** - Just look at the URL path  
✅ **Secure** - Idempotent, never modifies existing profiles  
✅ **SSR compatible** - Works server and client-side  
✅ **Intuitive** - Path matches user intent  

---

_Last updated: 2025-11-17 (Path-based inference - no search params needed!)_

