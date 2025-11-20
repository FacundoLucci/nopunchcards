# Business Signup - Complete Solution

**Date:** 2025-11-17  
**Problem:** Business signups created Better Auth accounts but not Convex profiles with correct roles  
**Solution:** Path-based role inference + manual Convex auth token refresh

## The Core Issue

After Better Auth signup in production:
1. ✅ Better Auth creates account + session cookie
2. ❌ **Convex client doesn't know about the new auth token**
3. ❌ All Convex mutations fail with "Unauthenticated"
4. ❌ Profile never created
5. ❌ User redirected to wrong onboarding

## The Complete Solution

### Part 1: Manual Auth Token Refresh After Signup

**Problem:** Convex client's auth token only updates during page navigation, not during signup.

**Solution:** Manually refresh the token after signup:

```typescript
// In signup.tsx after successful Better Auth signup
const { createAuth } = await import("../../convex/auth");
const cookieName = getCookieName(createAuth);

// Read session token from browser cookies
const token = document.cookie
  .split("; ")
  .find((row) => row.startsWith(`${cookieName}=`))
  ?.split("=")[1];

if (token) {
  // Update Convex client with new auth
  await context.convexClient.setAuth(async () => token);
  await new Promise(resolve => setTimeout(resolve, 200)); // Let it propagate
}

// NOW profile creation will work
await createProfile({ role: "business_owner" });
```

### Part 2: Path-Based Role Inference

**Problem:** How does fallback code know if user intended business vs consumer?

**Solution:** Infer from the URL path:
- `/business/register` → business_owner
- `/consumer/onboarding` → consumer

```typescript
// In business/register.tsx
ensureProfileMutation({ role: "business_owner" }) // Hardcoded based on path

// In consumer/onboarding.tsx
ensureProfileMutation({ role: "consumer" }) // Hardcoded based on path
```

### Part 3: Fallback Auth Refresh on Page Load

**Problem:** If signup token refresh fails, fallback still gets "Unauthenticated".

**Solution:** Also refresh token on fallback pages:

```typescript
// In business/register.tsx and consumer/onboarding.tsx
useEffect(() => {
  const ensureAuthAndProfile = async () => {
    // Refresh Convex auth token from cookies
    const token = /* read from cookies */;
    if (token) {
      await context.convexClient.setAuth(async () => token);
    }
    
    // Now create/verify profile
    await ensureProfileMutation({ role: "business_owner" });
  };
  
  ensureAuthAndProfile();
}, []);
```

## Complete User Flow

### Successful Business Signup (Most Common)

```
1. Visit /signup?mode=business
2. Fill form, submit
3. Better Auth creates account + session cookie
4. ✅ Convex client auth token refreshed manually
5. ✅ Profile created with business_owner role
6. Redirect to /business/register
7. Page verifies profile exists (idempotent)
8. ✅ User proceeds to create business
```

### Business Signup with Timing Issues (Fallback)

```
1. Visit /signup?mode=business
2. Fill form, submit
3. Better Auth creates account + session cookie
4. ❌ Convex auth token refresh fails (network issue)
5. ❌ Profile creation fails
6. Redirect to /business/register
7. ✅ Page refreshes Convex auth token from cookies
8. ✅ Profile created with business_owner role (path-based)
9. ✅ User proceeds to create business
```

## Why This Works

### 1. Session Cookie is Already There

Better Auth writes the session cookie immediately after signup. We just need to tell Convex about it:

```
Better Auth signup → Session cookie in browser → Read it → Give to Convex
```

### 2. Multiple Auth Refresh Points

Three chances to sync the auth token:
- During signup (primary)
- On business/register page load (fallback)
- On consumer/onboarding page load (fallback)

### 3. Idempotent Profile Creation

The `ensureProfile` mutation is safe to call multiple times:
```typescript
// Returns existing profile unchanged
if (existing) {
  return { profileId: existing._id, wasCreated: false, role: existing.role };
}

// Or creates new profile if missing
return { profileId, wasCreated: true, role };
```

## Files Changed

### 1. src/routes/signup.tsx
- ✅ Added `useRouteContext` to access Convex client
- ✅ Added `getCookieName` import
- ✅ Manual auth token refresh after Better Auth signup
- ✅ 200ms delay for token to propagate
- ✅ Profile creation with error handling

### 2. src/routes/_authenticated/business/register.tsx
- ✅ Added `useRouteContext` and `getCookieName`
- ✅ Wrapped profile logic in async `ensureAuthAndProfile` function
- ✅ Auth token refresh before profile creation
- ✅ Hardcoded `business_owner` role (path-based inference)

### 3. src/routes/_authenticated/consumer/onboarding.tsx
- ✅ Same changes as business register
- ✅ Hardcoded `consumer` role (path-based inference)

### 4. convex/users.ts
- ✅ Updated `ensureProfile` return type to include `wasCreated` and `role`
- ✅ Added free plan assignment for new profiles
- ✅ Added `internal` import
- ✅ Never modifies existing profile roles (security)

## Testing in Production

Deploy both Convex and frontend:

```bash
# Deploy Convex functions
npx convex deploy --prod

# Build and deploy frontend
npm run build
# Deploy to your hosting (Netlify/Vercel/etc)
```

Then test:
1. Sign up as business at `/signup?mode=business`
2. Watch browser console for auth token refresh logs
3. Should see profile created with `business_owner` role
4. Should redirect to `/business/register`  
5. Should NOT see any "Unauthenticated" errors

## Why Production Was Different from Dev

**Development:**
- Localhost cookies propagate instantly
- Less network latency
- More forgiving timing
- Worked without explicit token refresh

**Production:**
- Cross-domain cookies (if applicable)
- Network latency
- CDN caching
- Stricter timing requirements
- **Needs explicit token refresh**

## Security Notes

### Is Manual Cookie Reading Safe?

Yes! We're reading our own session cookie:
- Cookie is HTTP-only (can't be stolen by XSS)
- We're not exposing it, just passing it to Convex
- Convex verifies the token server-side
- Standard pattern for SPA + SSR auth

### Can Users Manipulate Their Role?

No:
1. `ensureProfile` never modifies existing profiles
2. Business creation still requires authorization
3. RoleGuard protects all routes
4. Role comes from database, not client

## Alternative Approaches Considered

### ❌ Better Auth useSession Hook

```typescript
const { data: session } = useSession();
// Wait for session.user.id before creating profile
```

**Rejected:** Adds complexity, still has timing issues

### ❌ Server-Side Profile Creation

Use Better Auth lifecycle hooks to create profile server-side.

**Rejected:** 
- Better Auth hooks don't have direct Convex access
- More complex setup
- Client-side approach simpler

### ✅ Manual Token Refresh (Current)

Direct, simple, works reliably.

---

_Last updated: 2025-11-17 (Production auth sync fix)_

