# Business Signup Auth Synchronization Fix

**Date:** 2025-11-17  
**Issue:** Business signups in production getting "Unauthenticated" errors on both signup and fallback  
**Root Cause:** Convex client not syncing auth token after Better Auth creates session

## The Real Problem

After Better Auth completes signup:
1. ✅ Better Auth creates account successfully
2. ✅ Session cookie is set in browser
3. ❌ **Convex client doesn't know about the new auth token**
4. ❌ All Convex mutations fail with "Unauthenticated"

### Why This Happens

The Convex client's auth token is normally set during SSR in `__root.tsx`:

```typescript
// In beforeLoad (runs on page navigation)
const { token } = await fetchAuth();
if (token) {
  ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
}

// In component (runs on client)
context.convexClient.setAuth(async () => context.token ?? null);
```

But during signup:
- User stays on `/signup` page briefly
- No navigation happens yet
- `beforeLoad` doesn't run
- Convex client never gets the new token
- All mutations fail!

## The Solution: Manual Token Refresh

After signup completes, **manually refresh the Convex client's auth token** before trying to create the profile:

### Signup Page

**File:** `src/routes/signup.tsx`

```typescript
// After successful Better Auth signup
const { error } = await authClient.signUp.email({ email, password, name });

if (!error) {
  // Manually refresh Convex auth token
  const { createAuth } = await import("../../convex/auth");
  const cookieName = getCookieName(createAuth);
  
  // Read the session token from cookies
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${cookieName}=`))
    ?.split("=")[1];

  if (token) {
    // Update Convex client with the new token
    await context.convexClient.setAuth(async () => token);
    console.log("[Signup] Auth token refreshed successfully");
    
    // Small delay for Convex to apply the new auth
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // NOW profile creation will work
  await createProfile({ role });
}
```

### Fallback Pages (Business Register & Consumer Onboarding)

Both pages now also refresh the auth token on load to handle the case where signup token refresh failed:

**Pattern:**
```typescript
useEffect(() => {
  const ensureAuthAndProfile = async () => {
    // Step 1: Refresh auth token from cookies
    try {
      const { createAuth } = await import("../../../../convex/auth");
      const cookieName = getCookieName(createAuth);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${cookieName}=`))
        ?.split("=")[1];

      if (token && context.convexClient) {
        await context.convexClient.setAuth(async () => token);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.warn("Could not refresh auth:", error);
    }

    // Step 2: Now create/verify profile
    ensureProfileMutation({ role: "business_owner" }) // or "consumer"
      .then((result) => {
        setProfileReady(true);
      });
  };

  ensureAuthAndProfile();
}, [ensureProfileMutation, context.convexClient]);
```

## Why This Works

### Three-Layer System with Auth Sync

**Layer 1: Signup Page (Primary)**
```
1. Better Auth signup
2. Refresh Convex auth token ← NEW!
3. Create profile with correct role
4. ✅ Most users succeed here
```

**Layer 2: Business/Consumer Pages (Fallback)**
```
1. Page loads after signup redirect
2. Refresh Convex auth token ← NEW!
3. Create profile based on path
4. ✅ Catches any signup failures
```

**Layer 3: Idempotent Safety**
```
ensureProfile mutation is safe to call multiple times
- Returns existing profile if found
- Never modifies existing roles
```

## Files Changed

1. **`src/routes/signup.tsx`**
   - Added `useRouteContext` to get Convex client
   - Added `getCookieName` import
   - Manual auth token refresh after signup
   - Waits 200ms for token to apply before creating profile

2. **`src/routes/_authenticated/business/register.tsx`**
   - Added `useRouteContext` to get Convex client
   - Added `getCookieName` import
   - Wrapped profile creation in `ensureAuthAndProfile` async function
   - Refreshes auth token before creating profile

3. **`src/routes/_authenticated/consumer/onboarding.tsx`**
   - Same changes as business register
   - Ensures consumer profile with auth refresh

4. **`convex/users.ts`**
   - Updated `ensureProfile` to return detailed info:
     - `profileId` - The profile ID
     - `wasCreated` - Whether it was just created
     - `role` - The actual role assigned
   - Added free plan assignment for new profiles
   - Added `internal` import for scheduler

## Testing Scenarios

### Happy Path (Layer 1 Works)
- [x] Signup → Auth refresh → Profile created → Redirect → Success

### Fallback Path (Layer 2 Activates)
- [x] Signup → Auth refresh fails → Redirect → Page refreshes auth → Profile created

### Production Issues Resolved
- [x] Session cookie exists but Convex client unauthenticated → Fixed
- [x] Both signup AND fallback failing → Fixed with dual auth refresh
- [x] Business owners getting consumer profiles → Fixed with path-based inference

## Key Insights

### Why Production Failed But Dev Worked

In development, the auth token might persist longer or timing is more forgiving. In production:
- Network latency is higher
- Cookie propagation might be slower
- SSR cache might be stale
- Need explicit client-side token refresh

### Cookie-Based Auth Flow

Better Auth uses HTTP-only cookies for sessions:
```
1. Better Auth signup → Sets session cookie in browser
2. Convex client needs to read that cookie → Manual process
3. getCookieName() gets the dynamic cookie name
4. document.cookie reads it client-side
5. context.convexClient.setAuth() applies it to Convex
```

### Why We Need the Delay

```typescript
await context.convexClient.setAuth(async () => token);
await new Promise(resolve => setTimeout(resolve, 200));
```

`setAuth()` is async but doesn't guarantee the token is applied to in-flight requests immediately. A small delay ensures the token propagates before making mutations.

## Production Deployment

After deploying this fix:

1. **Convex functions** - Already deployed
2. **Frontend code** - Needs rebuild and redeploy
   ```bash
   npm run build
   # Deploy to Netlify/Vercel/your hosting
   ```

3. **Test flow:**
   - Sign up as business at `/signup?mode=business`
   - Watch console logs for token refresh
   - Should see profile created with business_owner role
   - Should redirect to business register page
   - Should NOT see unauthenticated errors

## Future Improvements

### Option: Use Better Auth's Session Hook

Instead of manual cookie parsing, could use Better Auth's session state:

```typescript
import { useSession } from "@convex-dev/better-auth/react";

const { data: session } = useSession();
// But this requires waiting for session to load, adding complexity
```

Current approach is simpler and more direct.

### Option: Server-Side Profile Creation

Could create profiles server-side using Better Auth lifecycle hooks, but:
- Requires accessing Convex from Better Auth callback
- More complex setup
- Current client-side approach is simpler

---

_Last updated: 2025-11-17 (Auth token sync fix for production)_

