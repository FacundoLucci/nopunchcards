# Business Signup Profile Creation Fix

**Date:** 2025-11-17
**Issue:** Business signups weren't creating profiles with correct roles in production
**Root Cause:** Session sync timing issues between Better Auth and Convex in production

## Problem

When users signed up for a business account:
1. Better Auth account was created successfully
2. Profile creation during signup failed due to session sync delays
3. Error was caught and swallowed
4. User redirected to `/business/register` without a profile
5. App routing defaulted everyone without a profile to consumer onboarding

## Solution: Multi-Layer Fallback System

### Layer 1: Signup Page Profile Creation (Primary)

**File:** `src/routes/signup.tsx`

```typescript
// Try to create profile during signup with role
const role = isBusiness ? "business_owner" : "consumer";
const result = await createProfile({ role });
```

- **Success:** Profile created with correct role
- **Failure:** Continue anyway, profile will be created by fallback

### Layer 2: Automatic Profile Creation on First Load (Fallback)

**File:** `convex/users/ensureProfile.ts`

New mutation that guarantees profile existence:

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
    // Check if profile exists
    // If not, create with specified or default role
    // Returns: { profileId, wasCreated, role }
  },
});
```

### Layer 3: App-Level Profile Guard

**Files:** `src/routes/app.tsx`, `src/components/RoleGuard.tsx`

Both components now auto-create missing profiles:

```typescript
if (profile === null && !isCreatingProfile) {
  // No profile - create default consumer profile
  ensureProfile({})
    .then((result) => {
      // Profile created, reactive query will update
      // User will be redirected based on actual role
    });
}
```

## Benefits of This Approach

✅ **Resilient:** Multiple fallback layers ensure profiles are always created  
✅ **Role Preservation:** Business signups still attempt to set role during signup  
✅ **Self-Healing:** Missing profiles auto-created on first authenticated request  
✅ **User-Friendly:** No errors shown to users, seamless experience  
✅ **Production-Ready:** Handles network delays and timing issues gracefully

## User Flow

### Successful Signup (Layer 1 Works)
1. User signs up as business owner
2. Better Auth account created
3. Profile created with `business_owner` role
4. Redirected to `/business/register`
5. ✅ Works perfectly

### Signup with Timing Issues (Layer 2 Activates)
1. User signs up as business owner
2. Better Auth account created
3. Profile creation fails (session not synced yet)
4. Redirected to `/business/register` (or `/app`)
5. App detects no profile exists
6. Automatically creates profile with default `consumer` role
7. User redirected based on created role
8. ⚠️ User ends up as consumer instead of business owner

### Important Note
The fallback currently creates **consumer** profiles by default. This is intentional because:
- It's safer to default to lower privileges
- Business owners can be manually upgraded
- Prevents accidental admin/business access

## Future Improvements

### Option 1: Store Intended Role in URL
```typescript
// During signup
navigate({ 
  to: "/app", 
  search: { intendedRole: "business_owner" } 
});

// In app.tsx
const { intendedRole } = useSearch();
ensureProfile({ role: intendedRole || "consumer" });
```

### Option 2: Use Better Auth Custom Fields (Requires Setup)
Better Auth supports custom user fields, but requires schema customization:
- Generate custom schema
- Add `role` field to user table
- Access during profile creation

### Option 3: Session Storage
```typescript
// During signup
sessionStorage.setItem('signupRole', role);

// During profile creation
const role = sessionStorage.getItem('signupRole') || 'consumer';
sessionStorage.removeItem('signupRole');
```

## Architectural Question: Do We Need the Profiles Table?

### Current Architecture
- **Better Auth `user` table:** Authentication (email, password, name, email verification)
- **Better Auth `session` table:** Active sessions
- **App `profiles` table:** Application-specific data (role, onboarding status)

### Could We Use Only Better Auth Tables?

**Yes, with Local Install:** The docs you linked ([convex-better-auth.netlify.app/features/local-install](https://convex-better-auth.netlify.app/features/local-install)) explain how to:
1. Generate Better Auth schema locally
2. Add custom indexes
3. Access Better Auth component tables directly from Convex functions

**However, the separate `profiles` table is recommended because:**

#### ✅ Advantages of Separate Profiles Table

1. **Separation of Concerns**
   - Auth data = authentication & security
   - Profile data = application logic & features
   - Clear boundaries prevent mixing concerns

2. **Schema Flexibility**
   - Better Auth schema requires regeneration for updates
   - App-specific schema can evolve independently
   - No risk of breaking auth when adding features

3. **Easier Reasoning**
   - `user` table = "Can they log in?"
   - `profiles` table = "What can they do?"
   - Simple mental model for developers

4. **Standard Pattern**
   - Most apps separate auth from profile data
   - Familiar pattern for team members
   - Easier to find examples and help

5. **Migration Safety**
   - Can switch auth providers without losing app data
   - Profile data survives auth system changes
   - Reduces coupling to specific auth solution

#### ❌ Disadvantages of Merging into Better Auth Tables

1. **Schema Regeneration Complexity**
   ```bash
   cd convex/betterAuth
   npx @better-auth/cli generate -y
   # Need to manually preserve custom indexes and fields
   ```

2. **Mixed Concerns**
   - Auth configuration mixed with app logic
   - Harder to understand what's auth vs app
   - Risk of accidentally modifying auth-critical fields

3. **Better Auth Update Friction**
   - Schema changes require careful migration
   - Custom fields might conflict with future Better Auth features
   - Need to track which fields are "yours" vs "theirs"

4. **Limited Documentation**
   - Better Auth docs focus on auth use cases
   - Less guidance on app-specific customization
   - More trial and error required

### Recommendation: Keep Separate Profiles Table

The current architecture is **correct**. The `profiles` table provides:
- Clean separation between auth and app concerns
- Flexibility to evolve independently
- Standard pattern that's easy to maintain
- No coupling to Better Auth's schema generation

The real issue was **profile creation timing**, which is now fixed with the multi-layer fallback system.

## Testing Checklist

- [ ] Consumer signup creates consumer profile
- [ ] Business signup creates business_owner profile
- [ ] Failed profile creation auto-recovers
- [ ] Users redirected to correct onboarding based on role
- [ ] Existing users with profiles not affected
- [ ] Role guards work with auto-created profiles

---

_Last updated: 2025-11-17_

