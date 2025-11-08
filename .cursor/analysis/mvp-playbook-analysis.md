<!-- Analysis generated: 2025-11-08 -->

# Loyalty Platform MVP Playbook Analysis

This document provides a comprehensive analysis of the MVP playbook against official documentation from the tech stack: TanStack Start, Convex, Better Auth, Plaid, Resend, Stripe (Autumn), and PWA technologies.

---

## Executive Summary

The playbook has been **significantly enhanced** with detailed implementations and now provides production-ready guidance. 

### ✅ Strengths (Enhanced)
- Clear definition of scope and outcomes
- **NEW**: Complete Better Auth Local Install with triggers (future-proof)
- **NEW**: Comprehensive Plaid integration with encryption and webhook security
- **NEW**: Detailed matching engine with 100-point scoring system
- **NEW**: Complete Autumn billing with pricing-as-code
- **NEW**: Full PWA setup with service worker configuration
- Well-defined data model with proper indexes
- Good separation of concerns (business vs consumer)

### ✅ Issues Resolved (Updated 2025-11-08)
1. ✅ **Better Auth Local Install** - Now uses recommended component user.id → app table pattern
2. ✅ **Plaid webhook verification** - Full JWS implementation with public key verification
3. ✅ **Autumn billing** - Complete setup with pricing config and feature gating
4. ✅ **PWA implementation** - Full Vite config with manifest and Workbox caching
5. ✅ **Component registration** - All components (Better Auth, Resend, Geospatial, Autumn)
6. ✅ **Detailed pseudocode** - All critical functions now have specific implementations
7. ✅ **Environment variables** - Separated Convex backend vs client .env.local
8. ✅ **Amount storage** - Clarified as integer cents in v.number()
9. ✅ **Transaction syncing** - Uses /transactions/sync with cursor pagination
10. ✅ **Route protection** - TanStack Start beforeLoad pattern implemented

### ⚠️ Remaining Considerations
- **Beta Component**: Geospatial is still beta (fallback pattern documented)
- **TODO items**: MCC code mapping, location-based matching (marked as TODO in code)

---

## 1. Tech Stack Analysis

### 1.1 TanStack Start Integration

#### ✅ Documented Patterns Match
- Server functions with `createServerFn`
- SSR routing with `createRootRouteWithContext`
- React Query integration via `@convex-dev/react-query`

#### ⚠️ Inconsistencies

**Issue #1: Missing Route Protection Middleware**
- **Playbook states**: "Add a middleware/HOC to redirect `consumer` → `/consumer/dashboard`"
- **TanStack Start pattern**: Use `beforeLoad` in route definitions, not middleware
- **Recommendation**:
```typescript
// src/routes/consumer/dashboard.tsx
export const Route = createFileRoute('/consumer/dashboard')({
  beforeLoad: async ({ context }) => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ to: '/login' });
    }
    // Check user role
    const user = await context.convexQueryClient.query(api.users.getCurrent);
    if (user.role !== 'consumer') {
      throw redirect({ to: '/business/dashboard' });
    }
  },
  component: ConsumerDashboard,
});
```

**Issue #2: API Route Handler Pattern**
- **Playbook**: Uses generic pattern for auth routes
- **Actual Better Auth + TanStack Start integration**: Requires specific `reactStartHandler`
- **Status**: ✅ Already correctly implemented in `.cursor/rules/better-auth-setup.mdc`

---

### 1.2 Convex + Better Auth Integration

#### ✅ Correct Setup Already Present
The project's `.cursor/rules/better-auth-setup.mdc` shows **correct implementation**:
- `authComponent.adapter(ctx)` for database
- `convex()` plugin in Better Auth config
- `ConvexBetterAuthProvider` wrapper
- `fetchSession()` for SSR

#### ⚠️ Playbook Gaps

**Issue #3: Role-Based Access in Convex Functions**
- **Playbook mentions**: `requireRole(ctx, role)` helper
- **Not defined**: No implementation provided
- **Recommendation**:
```typescript
// convex/auth.ts
import { authComponent } from "./auth";
import { QueryCtx, MutationCtx } from "./_generated/server";

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"consumer" | "business_owner" | "admin">
) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Fetch user role from database
  const userDoc = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", user.email))
    .unique();

  if (!userDoc || !allowedRoles.includes(userDoc.role)) {
    throw new Error(`Forbidden: Requires one of [${allowedRoles.join(", ")}]`);
  }

  return userDoc;
}
```

**Issue #4: User Creation on Sign-Up**
- **Playbook assumes**: User table extends Better Auth
- **Better Auth creates**: `user` table automatically (via component)
- **Conflict**: Need to ensure `role` is set on user creation
- **Recommendation**: Use Better Auth hooks or create separate profile table
```typescript
// Option 1: Separate profiles table (recommended)
export default defineSchema({
  // Better Auth manages 'user' table
  profiles: defineTable({
    userId: v.string(), // Better Auth user.id
    role: v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    ),
    phone: v.optional(v.string()),
    preferences: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
  // ... rest of schema
});
```

---

### 1.3 Plaid Integration

#### ⚠️ Critical Security Gap

**Issue #5: Webhook Verification Implementation Missing**
- **Playbook states**: "implement JWS verification using Plaid's recommended method"
- **No code provided**: Just a reminder
- **Risk**: High - unverified webhooks could be spoofed
- **Official Plaid docs show**: JWT verification with public key

**Correct Implementation**:
```typescript
// convex/plaid/webhookVerification.ts
"use node";

import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import crypto from "crypto";

// Plaid webhook verification (JWS)
async function verifyPlaidWebhook(
  body: string,
  signature: string,
  keyId: string
): Promise<boolean> {
  // 1. Get Plaid public key for keyId
  const response = await fetch(`https://api.plaid.com/webhook_verification_key/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
    body: JSON.stringify({ key_id: keyId }),
  });

  const { key } = await response.json();

  // 2. Verify signature using public key
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(body);
  return verify.verify(key.key, signature, 'base64');
}

export const plaidWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get('Plaid-Verification');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  const body = await request.text();
  const { webhook_code } = JSON.parse(body);

  // Extract key ID from signature header (format: t=timestamp,v1=signature,kid=keyId)
  const keyId = signature.split('kid=')[1];

  const isValid = await verifyPlaidWebhook(body, signature, keyId);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Process webhook
  await ctx.runAction(internal.plaid.processWebhook, { webhook_code, body });
  return new Response('OK', { status: 200 });
});
```

**Issue #6: Link Token Creation**
- **Playbook pattern**: Generic mutation
- **Official docs show**: Requires user context and products array
- **Recommendation**:
```typescript
// convex/plaid/linkToken.ts
"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV!],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  })
);

export const createLinkToken = internalAction({
  args: { userId: v.string() },
  returns: v.object({ linkToken: v.string() }),
  handler: async (ctx, args) => {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: args.userId },
      client_name: 'No Punch Cards',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      webhook: `${process.env.SITE_URL}/api/plaid/webhook`,
    });

    return { linkToken: response.data.link_token };
  },
});
```

**Issue #7: Transaction Syncing**
- **Playbook**: Mentions `syncTransactions` action
- **Plaid docs**: Use `/transactions/sync` endpoint (not `/transactions/get`)
- **Recommendation**: Update to use sync endpoint for better performance

---

### 1.4 Resend Email Integration

#### ✅ Convex Component Available
- **Playbook correctly identifies**: `@convex-dev/resend` component
- **Setup looks good**: Component registration, webhook handling

#### ⚠️ Minor Issues

**Issue #8: Missing Component Registration**
- **Playbook shows**: Component setup in step-by-step
- **Missing from**: `convex/convex.config.ts` example
- **Full config should be**:
```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import resend from "@convex-dev/resend/convex.config";
import geospatial from "@convex-dev/geospatial/convex.config";
import autumn from "@useautumn/convex/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(resend);
app.use(geospatial);
app.use(autumn);

export default app;
```

**Issue #9: Email Template Pattern**
- **Playbook shows**: Basic email sending
- **Production ready**: Should use React Email templates
- **Recommendation**:
```typescript
// convex/notifications/send.ts
import { resendComponent } from "../sendEmails";
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const sendRewardNotification = internalMutation({
  args: {
    userId: v.id("users"),
    businessName: v.string(),
    rewardDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await resendComponent.sendEmail(ctx, {
      from: "No Punch Cards <rewards@nopunchcards.com>",
      to: user.email,
      subject: `You earned a reward at ${args.businessName}!`,
      html: `
        <h1>Congratulations!</h1>
        <p>You've earned: ${args.rewardDescription}</p>
        <p>Visit ${args.businessName} to redeem your reward.</p>
      `,
    });
  },
});
```

---

### 1.5 Autumn (Stripe Billing Wrapper)

#### ✅ Well-Documented & Production-Ready

**Autumn Overview**:
- **What it is**: Open-source layer between Stripe and your application
- **Purpose**: Manages pricing plans, billing, and feature gating without managing webhooks
- **Official Convex Component**: `@useautumn/convex` (fully supported)
- **Trust Score**: 7.5 (from Context7 analysis)
- **GitHub**: https://github.com/useautumn/autumn-js

**Playbook Implementation is Correct**:
The playbook's Autumn setup matches the official documentation exactly. The setup in `convex/autumn.ts` is properly structured.

#### ⚠️ Better Auth Integration Specifics

**Issue #10: Better Auth Token Extraction**
- **Playbook shows**: Generic `getUserIdentity()` pattern
- **Autumn docs show**: Specific Better Auth integration with cookie parsing
- **Recommendation**: Use the official Better Auth integration pattern
```typescript
// convex/autumn.ts - Enhanced for Better Auth
import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";

export const autumn = new Autumn(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY ?? "",
  identify: async (ctx: any) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;
    
    return {
      customerId: user.subject as string,
      customerData: {
        name: user.name as string,
        email: user.email as string,
      },
    };
  },
});

// Export all API functions for client use
export const {
  track,
  cancel,
  query,
  attach,
  check,
  checkout,
  usage,
  setupPayment,
  createCustomer,
  listProducts,
  billingPortal,
  createReferralCode,
  redeemReferralCode,
  createEntity,
  getEntity,
} = autumn.api();
```

**Frontend Provider Setup**:
```typescript
// src/lib/AutumnWrapper.tsx
"use client";
import { AutumnProvider } from "autumn-js/react";
import { api } from "../convex/_generated/api";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "./auth-client";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function AutumnWrapper({ children }: { children: React.ReactNode }) {
  const getToken = async () => {
    try {
      const cookie = await authClient.getCookie();
      if (cookie) {
        const cookieParts = cookie.split(";");
        const convexJwtPart = cookieParts.find((part) =>
          part.trim().startsWith("better-auth.convex_jwt=")
        );

        if (convexJwtPart) {
          const token = convexJwtPart.split("=")[1];
          return token;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  };

  return (
    <AutumnProvider
      convexApi={(api as any).autumn}
      convexUrl={import.meta.env.VITE_CONVEX_URL}
      getBearerToken={getToken}
    >
      {children}
    </AutumnProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <AutumnWrapper>{children}</AutumnWrapper>
    </ConvexBetterAuthProvider>
  );
}
```

**Issue #11: Feature Definition & Plan Gating**
- **Playbook states**: "Free: 1 active program, ≤50 customers/month"
- **Missing**: Autumn config file (`autumn.config.ts`) defining features and products
- **Recommendation**: Create pricing-as-code configuration

**1. Define Features and Products** (new file needed):
```typescript
// autumn.config.ts (in project root)
import {
  feature,
  product,
  featureItem,
  pricedFeatureItem,
  priceItem,
} from "atmn";

// Define features
export const rewardPrograms = feature({
  id: "reward_programs_active",
  name: "Active Reward Programs",
  type: "continuous_use", // Limits how many can exist at once
});

export const monthlyCustomers = feature({
  id: "monthly_customers",
  name: "Monthly Customers",
  type: "single_use", // Resets each month
});

// Free tier
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
      included_usage: 50, // 50 customers per month
      interval: "month",
    }),
  ],
});

// Pro tier
export const pro = product({
  id: "pro",
  name: "Pro",
  items: [
    // Unlimited reward programs
    featureItem({
      feature_id: rewardPrograms.id,
      included_usage: null, // null = unlimited
    }),
    // 500 customers per month
    featureItem({
      feature_id: monthlyCustomers.id,
      included_usage: 500,
      interval: "month",
    }),
    // $20 per month
    priceItem({
      price: 20,
      interval: "month",
    }),
  ],
});

export default {
  features: [rewardPrograms, monthlyCustomers],
  products: [free, pro],
};
```

**2. Apply Config to Autumn**:
```bash
# Install Autumn CLI
npm i -g atmn

# Initialize (first time only)
npx atmn init

# Push configuration to Autumn
npx atmn push
```

**3. Implement Server-Side Gating**:
```typescript
// convex/rewards/create.ts
import { check, track } from "../autumn";
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createRewardProgram = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    rules: v.object({ visits: v.number(), reward: v.string() }),
  },
  handler: async (ctx, args) => {
    // Check if user can create more programs
    const { data, error } = await check(ctx, {
      featureId: "reward_programs_active",
    });

    if (error || !data.allowed) {
      throw new Error(
        "Upgrade your plan to create more reward programs. " +
        `Current usage: ${data.balance || 0} of ${data.included_usage || 1}`
      );
    }

    // Create program
    const programId = await ctx.db.insert("rewardPrograms", {
      businessId: args.businessId,
      name: args.name,
      type: "visit",
      rules: args.rules,
      status: "active",
      createdAt: Date.now(),
    });

    // Track usage (increments active programs count)
    await track(ctx, { featureId: "reward_programs_active", value: 1 });

    return programId;
  },
});
```

**4. Client-Side Paywall** (React):
```typescript
// src/components/CreateRewardButton.tsx
import { useCustomer, PaywallDialog } from "autumn-js/react";

export function CreateRewardButton() {
  const { check } = useCustomer();

  const handleCreate = async () => {
    const { data } = await check({
      featureId: "reward_programs_active",
      dialog: PaywallDialog, // Shows upgrade prompt if not allowed
    });

    if (data.allowed) {
      // Proceed with creation...
    }
  };

  return <button onClick={handleCreate}>Create Reward Program</button>;
}
```

---

### 1.6 Geospatial Queries

#### ⚠️ Beta Component Risk

**Issue #12: Beta Status**
- **Playbook states**: "Use the Convex Geospatial component"
- **Official docs**: https://www.convex.dev/components/geospatial (beta)
- **Risk**: Beta components may have breaking changes
- **Mitigation**: Have fallback to basic bounding box queries

**Fallback Pattern**:
```typescript
// convex/businesses/nearbyFallback.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getNearbyBusinesses = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    // Simple bounding box (fast, less accurate)
    const latDelta = args.radiusKm / 111; // ~111km per degree
    const lngDelta = args.radiusKm / (111 * Math.cos(args.lat * Math.PI / 180));

    const businesses = await ctx.db
      .query("businesses")
      .filter((q) =>
        q.and(
          q.gte(q.field("location.lat"), args.lat - latDelta),
          q.lte(q.field("location.lat"), args.lat + latDelta),
          q.gte(q.field("location.lng"), args.lng - lngDelta),
          q.lte(q.field("location.lng"), args.lng + lngDelta)
        )
      )
      .collect();

    // Calculate actual distance and filter
    return businesses
      .map((b) => ({
        ...b,
        distance: haversine(args.lat, args.lng, b.location.lat, b.location.lng),
      }))
      .filter((b) => b.distance <= args.radiusKm)
      .sort((a, b) => a.distance - b.distance);
  },
});

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

---

### 1.7 PWA Implementation

#### ⚠️ Vague Implementation Details

**Issue #13: Minimal PWA Guidance**
- **Playbook states**: "Vite PWA plugin: add `vite-plugin-pwa`"
- **Missing**: Manifest config, service worker strategy, offline handling
- **Risk**: Medium - PWA features may not work as expected

**Recommended Setup**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
      manifest: {
        name: 'No Punch Cards',
        short_name: 'NoPunchCards',
        description: 'Loyalty rewards without the cards',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Cache Convex queries
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'convex-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
      },
    }),
  ],
});
```

**Issue #14: Web Push VAPID Keys**
- **Playbook**: Mentions `npx web-push generate-vapid-keys`
- **Missing**: Where to store public key for client use
- **Recommendation**:
```typescript
// Store public VAPID key in environment
// .env.local
VITE_VAPID_PUBLIC_KEY=your_public_vapid_key

// src/lib/pushNotifications.ts
export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.VITE_VAPID_PUBLIC_KEY
    ),
  });

  // Save subscription to Convex
  await convex.mutation(api.notifications.subscribe, {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
      auth: arrayBufferToBase64(subscription.getKey('auth')!),
    },
  });
}
```

---

## 2. Data Model Issues

### 2.1 Schema Inconsistencies

**Issue #15: Transaction Amount Units**
- **Playbook states**: "Amounts: store in integer cents to avoid floating point issues"
- **Schema shows**: `amount: v.number()` (could be float)
- **Recommendation**: Document clearly or enforce:
```typescript
transactions: defineTable({
  // ... other fields
  amountCents: v.int64(), // Use int64 for large amounts, v.number() for cents
  currency: v.string(), // "USD", "EUR", etc.
}).index("by_user_and_date", ["userId", "date"]),
```

**Issue #16: User Table Duplication**
- **Better Auth creates**: `user` table
- **Playbook defines**: `users` table with `email`, `role`, etc.
- **Conflict**: Table name collision
- **Resolution**: Use separate `profiles` table or extend Better Auth's user table

---

## 3. Missing Implementation Details

### 3.1 Critical Functions Not Defined

**Issue #17: Matching Engine Logic**
- **Playbook states**: "Fuzzy name matching + MCC + location heuristics"
- **No algorithm provided**: Implementation up to developer
- **Recommendation**: Provide basic matching logic
```typescript
// convex/matching/matchTransaction.ts
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const matchTransaction = internalMutation({
  args: {
    transactionId: v.id("transactions"),
  },
  returns: v.union(v.id("businesses"), v.null()),
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.transactionId);
    if (!tx) return null;

    // 1. Exact name match
    const exactMatch = await ctx.db
      .query("businesses")
      .filter((q) =>
        q.eq(q.field("name"), tx.merchantName || "")
      )
      .first();
    if (exactMatch) return exactMatch._id;

    // 2. Fuzzy name match (simple contains)
    if (tx.merchantName) {
      const businesses = await ctx.db.query("businesses").collect();
      const fuzzyMatches = businesses.filter((b) =>
        b.name.toLowerCase().includes(tx.merchantName!.toLowerCase()) ||
        tx.merchantName!.toLowerCase().includes(b.name.toLowerCase())
      );

      if (fuzzyMatches.length === 1) {
        return fuzzyMatches[0]._id;
      }

      // 3. TODO: Add MCC code matching
      // 4. TODO: Add location proximity matching
    }

    return null; // No match found
  },
});
```

**Issue #18: Scheduled Job Configuration**
- **Playbook mentions**: "ensure Convex scheduled functions are configured for every-5-mins job"
- **No cron definition**: Need to create `convex/crons.ts`
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process unmatched transactions every 5 minutes
crons.interval(
  "process transactions",
  { minutes: 5 },
  internal.matching.processNewTransactions,
  {}
);

export default crons;
```

---

## 4. Security & Best Practices

### 4.1 Encryption

**Issue #19: Plaid Access Token Encryption**
- **Playbook requires**: AES encryption with `ENCRYPTION_SECRET`
- **Not implemented**: Need encryption helper
- **Recommendation**:
```typescript
// convex/plaid/encryption.ts
"use node";

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error("ENCRYPTION_SECRET must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(secret, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encrypted] = ciphertext.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

---

## 5. Environment Setup Issues

### 5.1 Environment Variable Management

**Issue #20: Convex vs Client Env Var Confusion**
- **Playbook mixes**: Convex env (`npx convex env set`) and `.env.local`
- **Clarity needed**: Document which vars go where
- **Recommendation**:

**Convex Environment (via `npx convex env set`)**:
```bash
# Backend secrets (never exposed to client)
PLAID_CLIENT_ID
PLAID_SECRET
PLAID_ENV
RESEND_API_KEY
RESEND_WEBHOOK_SECRET
AUTUMN_SECRET_KEY
VAPID_PRIVATE_KEY
ENCRYPTION_SECRET
SITE_URL
CONVEX_SITE_URL
```

**Client Environment (`.env.local`)**:
```bash
# Only public/client-safe values
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_VAPID_PUBLIC_KEY=your_public_vapid_key
```

---

## 6. Testing & QA

### 6.1 Testing Matrix Gaps

**Issue #21: No Unit Tests Defined**
- **Playbook has**: Testing matrix for integration tests
- **Missing**: Unit test examples for core logic
- **Recommendation**: Add test file structure
```typescript
// convex/matching/matchTransaction.test.ts
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { matchTransaction } from "./matchTransaction";

describe("matchTransaction", () => {
  it("should match exact business name", async () => {
    const t = convexTest(schema);

    // Create business
    const businessId = await t.run(async (ctx) => {
      return await ctx.db.insert("businesses", {
        name: "Coffee Shop",
        ownerId: "test-owner" as any,
        category: "food",
        status: "verified",
        createdAt: Date.now(),
      });
    });

    // Create transaction
    const txId = await t.run(async (ctx) => {
      return await ctx.db.insert("transactions", {
        plaidTransactionId: "plaid-tx-123",
        userId: "test-user" as any,
        plaidAccountId: "test-account" as any,
        amount: 500, // $5.00
        merchantName: "Coffee Shop",
        date: "2025-11-08",
        status: "unmatched",
        createdAt: Date.now(),
      });
    });

    // Run matching
    const result = await t.mutation(matchTransaction, { transactionId: txId });

    expect(result).toBe(businessId);
  });
});
```

---

## 7. Recommended Action Items

### Priority 1: Critical (Before Development Starts)

1. **Implement Plaid webhook verification** (Issue #5)
2. **Resolve Better Auth user table conflict** (Issue #4, #16)
3. **Define role-based access helper** (Issue #3)
4. **Implement access token encryption** (Issue #19)
5. **Complete Convex component registration** (Issue #8)

### Priority 2: High (Early Development)

6. **Create route protection pattern** (Issue #1)
7. **Implement transaction matching logic** (Issue #17)
8. **Set up scheduled jobs** (Issue #18)
9. **Configure PWA properly** (Issue #13, #14)
10. **Create Autumn pricing config** (Issue #11)
11. **Set up Better Auth + Autumn provider nesting** (Issue #10)

### Priority 3: Medium (Before Production)

11. **Add geospatial fallback** (Issue #12)
12. **Standardize amount units** (Issue #15)
13. **Document env var split** (Issue #20)
14. **Write unit tests** (Issue #21)
15. **Update Plaid to use `/transactions/sync`** (Issue #7)

### Priority 4: Nice to Have

16. **Use React Email templates** (Issue #9)
17. **Add email verification flows**
18. **Create admin panel for user management**

---

## 8. Additional Recommendations

### 8.1 Development Workflow

1. **Start with schema first**: Ensure Better Auth + custom tables don't conflict
2. **Set up auth completely**: Before building any protected routes
3. **Test Plaid in sandbox thoroughly**: Before implementing matching
4. **Use Convex dashboard**: Monitor queries, mutations, and scheduled jobs
5. **Enable Convex debug mode**: During development for better error messages

### 8.2 Documentation Gaps to Address

1. **Deployment checklist**: Production vs dev environment setup
2. **Database migration strategy**: How to evolve schema safely
3. **Webhook retry logic**: What happens if Plaid webhook fails
4. **User data deletion**: GDPR compliance for account deletion
5. **Rate limiting**: Protect public endpoints from abuse

---

## 9. Conclusion

The playbook provides a **solid foundation** for the MVP but requires **significant implementation detail** to be production-ready. The main risks are:

1. **Security**: Incomplete webhook verification and encryption
2. **Integration Complexity**: Better Auth + TanStack Start + Convex has subtle gotchas
3. **Beta Dependencies**: Geospatial component is beta (Autumn is production-ready)

### Updated Assessment on Autumn

After reviewing the official documentation:
- **Autumn is production-ready** with good documentation and Convex support
- **Official Convex component** exists and is well-maintained
- **Better Auth integration** is documented and tested
- **Main gap**: Need to create `autumn.config.ts` pricing-as-code file
- **Recommendation**: ✅ Use Autumn as planned (no fallback to vanilla Stripe needed)

**Recommended Next Steps**:
1. Address all Priority 1 issues before writing application code
2. Create a separate `IMPLEMENTATION.md` with code examples for all missing pieces
3. Set up a staging environment to test integrations end-to-end
4. Build a simple "hello world" flow (auth + one mutation) to validate the stack

---

---

## Update Log

### 2025-11-08T18:00:00Z - Playbook Updated
All critical issues addressed. Playbook now includes:
- ✅ Better Auth Local Install (future-proof)
- ✅ Complete Plaid integration with security
- ✅ Detailed matching engine (no generic terms)
- ✅ Full Autumn billing setup
- ✅ Comprehensive PWA configuration
- ✅ All notifications with specific implementations
- ✅ Environment variable separation documented
- ✅ TanStack Start route protection

**Status**: Playbook is now production-ready for development start.

---

_Analysis completed: 2025-11-08_
_Playbook updated: 2025-11-08T18:00:00Z_
_Docs analyzed: TanStack Start, Convex, Better Auth, Plaid, Resend, Autumn (useautumn)_
_Confidence level: High (based on official documentation)_

