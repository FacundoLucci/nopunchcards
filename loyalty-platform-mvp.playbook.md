<!-- Playbook generated: 2025-11-08T00:00:00Z -->

# Loyalty Platform MVP — Execution Playbook (All-in-One)

This document is the single source of truth to execute the MVP end-to-end. It includes prerequisites, local setup, environment variables, schema, Convex functions, routes, acceptance criteria, risks/blockers, and a step-by-step checklist.

## Scope & Outcomes

- Tech stack: TanStack Start + Convex + Better Auth + Plaid + Autumn (Stripe billing) + PWA + Resend.
- Core flow: Plaid webhooks → Transaction matching → Reward progress → Notifications.
- Goal: Functional MVP in sandbox mode with clear “Definition of Done” per phase.

## Prerequisites

- Node 20+, pnpm 9+, Git, Convex CLI (`pnpm dlx convex dev` will prompt install).
- Accounts: Plaid (Sandbox), Convex Cloud, email provider (Resend), Autumn (billing). Both Resend and Autumn are required.
- TLS domain for production (required for Web Push in prod; dev works on localhost).

## Local Dev Quickstart

```bash
pnpm install
pnpm dev               # start TanStack Start
pnpm dlx convex dev    # starts Convex in parallel (accept prompts)
```

If `convex dev` is already running in another terminal, skip starting a second instance.

## Environment & Secrets

All secrets live in Convex env. Generate or obtain the following and set them:

```bash
# Plaid (Sandbox)
npx convex env set PLAID_CLIENT_ID "<your_plaid_client_id>"
npx convex env set PLAID_SECRET "<your_plaid_secret>"
npx convex env set PLAID_ENV "sandbox"

# Web Push (VAPID)
npx web-push generate-vapid-keys
# Copy the keys produced by the command:
npx convex env set VAPID_PUBLIC_KEY "<vapid_public_key>"
npx convex env set VAPID_PRIVATE_KEY "<vapid_private_key>"

# Email (Resend — required)
npx convex env set RESEND_API_KEY "<resend_api_key>"
# Optional (webhook for delivery/bounce events)
npx convex env set RESEND_WEBHOOK_SECRET "<resend_webhook_secret>"

# Autumn (billing — required)
npx convex env set AUTUMN_SECRET_KEY "<autumn_secret_key>"

# Data encryption key for Plaid access tokens (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx convex env set ENCRYPTION_SECRET "<64_hex_chars>"
```

Dev deployment (Sandbox) — exact commands

```bash
# Plaid (Sandbox)
npx convex env set PLAID_CLIENT_ID "67528ce1c45170001aa885f9"
npx convex env set PLAID_SECRET "5618db9c54a02af60976065ba33da4"
npx convex env set PLAID_ENV "sandbox"

# Email (Resend)
npx convex env set RESEND_API_KEY "re_5D3zJsQ3_5CEVY6BSYpDFzX9kUQKZ75PG"
# Optional webhook secret (from Resend dashboard)
npx convex env set RESEND_WEBHOOK_SECRET "<dev_resend_webhook_secret>"

# Autumn (required)
npx convex env set AUTUMN_SECRET_KEY "am_sk_test_VdHgcqyFQ5AURAmdG01GpvX7I7NFH28o18CpqFqNmo"

# Web Push (generate locally; replace with your keys)
npx convex env set VAPID_PUBLIC_KEY "<dev_vapid_public_key>"
npx convex env set VAPID_PRIVATE_KEY "<dev_vapid_private_key>"

# Encryption key (generate once and store securely)
npx convex env set ENCRYPTION_SECRET "<dev_64_hex_chars>"
```

Prod deployment — exact commands (fill placeholders)

```bash
# Plaid (Production)
npx convex env set PLAID_CLIENT_ID "67528ce1c45170001aa885f9"
npx convex env set PLAID_SECRET "dcef078598b98241535c246b64af1a"
npx convex env set PLAID_ENV "production"

# Email (Resend)
npx convex env set RESEND_API_KEY "<prod_resend_api_key>"
npx convex env set RESEND_WEBHOOK_SECRET "<prod_resend_webhook_secret>"

# Autumn
npx convex env set AUTUMN_SECRET_KEY "<prod_autumn_secret_key>"

# Web Push (VAPID for prod domain)
npx convex env set VAPID_PUBLIC_KEY "<prod_vapid_public_key>"
npx convex env set VAPID_PRIVATE_KEY "<prod_vapid_private_key>"

# Encryption key (distinct from dev)
npx convex env set ENCRYPTION_SECRET "<prod_64_hex_chars>"
```

Notes:

- Use `ENCRYPTION_SECRET` to AES-encrypt Plaid access tokens before storing.
- Production deployments must rotate keys safely; document rotation steps when needed.
- Web Push requires HTTPS in production (localhost is allowed for dev).
- Never commit secrets. Use `convex env set` per deployment (dev/prod) instead of `.env` files.

## Data Model (convex/schema.ts)

**Important**: Better Auth manages the `user` table. We use Better Auth Local Install with triggers to extend user data into a `profiles` table.

**Architecture Decision**: We follow the **recommended pattern** of storing the Better Auth `user.id` (component user ID) in our app tables. This is future-proof and avoids the deprecated pattern of tracking app user IDs in the component.

References:

- [Convex + Better Auth Local Install](https://convex-better-auth.netlify.app/features/local-install)
- [Migration Guide](https://convex-better-auth.netlify.app/migrations/migrate-userid) - We follow "Track component user id in app table"

Authoritative tables and indexes to create first. Example schema (reference):

```ts
import { defineSchema, defineTable, v } from "convex/schema";

export default defineSchema({
  // Better Auth manages the 'user' table in convex/betterAuth/
  // We extend it with a profiles table that references Better Auth user.id
  // This follows the recommended pattern: component user id → app table
  profiles: defineTable({
    userId: v.string(), // Better Auth user.id (component user ID)
    role: v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    ),
    phone: v.optional(v.string()),
    preferences: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"]) // Primary lookup: auth ID → profile
    .index("by_role", ["role"]),

  businesses: defineTable({
    ownerId: v.string(), // Better Auth user.id (component user ID)
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    address: v.optional(v.string()),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })), // see geospatial note below
    logoUrl: v.optional(v.string()),
    status: v.union(v.literal("verified"), v.literal("unverified")),
    mccCodes: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  plaidAccounts: defineTable({
    userId: v.string(), // Better Auth user.id (component user ID)
    plaidItemId: v.string(),
    plaidAccessTokenCiphertext: v.string(), // encrypted with ENCRYPTION_SECRET
    accountIds: v.array(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("disconnected"),
      v.literal("error")
    ),
    institutionName: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_item", ["plaidItemId"]),

  transactions: defineTable({
    plaidTransactionId: v.string(),
    userId: v.string(), // Better Auth user.id (component user ID)
    plaidAccountId: v.id("plaidAccounts"),
    amount: v.number(), // cents minor units or decimal? choose one – recommend cents (int)
    merchantName: v.optional(v.string()),
    date: v.string(), // ISO yyyy-mm-dd from Plaid
    category: v.optional(v.array(v.string())),
    businessId: v.optional(v.id("businesses")), // matched business
    status: v.union(
      v.literal("pending"),
      v.literal("matched"),
      v.literal("unmatched")
    ),
    createdAt: v.number(),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_business_and_date", ["businessId", "date"])
    .index("by_plaid_tx", ["plaidTransactionId"]),

  rewardPrograms: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.literal("visit"), // MVP
    rules: v.object({ visits: v.number(), reward: v.string() }),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("archived")
    ),
    startDate: v.optional(v.string()), // ISO
    endDate: v.optional(v.string()), // ISO
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  rewardProgress: defineTable({
    userId: v.string(), // Better Auth user.id (component user ID)
    businessId: v.id("businesses"),
    rewardProgramId: v.id("rewardPrograms"),
    currentVisits: v.number(),
    totalEarned: v.number(),
    lastVisitDate: v.optional(v.string()),
    transactionIds: v.array(v.id("transactions")),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("expired")
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_business", ["businessId"])
    .index("by_program", ["rewardProgramId"]),

  notifications: defineTable({
    userId: v.string(), // Better Auth user.id (component user ID)
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    channel: v.union(v.literal("push"), v.literal("email")),
    status: v.union(v.literal("unread"), v.literal("read"), v.literal("sent")),
    createdAt: v.number(),
  }).index("by_user_and_status", ["userId", "status"]),

  // Optional: push subscriptions
  pushSubscriptions: defineTable({
    userId: v.string(), // Better Auth user.id (component user ID)
    endpoint: v.string(),
    keys: v.object({ p256dh: v.string(), auth: v.string() }),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
});
```

## Better Auth Local Install Setup

Use Better Auth Local Install to have full control over the auth schema and enable triggers. This also follows the **recommended pattern** for future-proofing: we store Better Auth's `user.id` (component user ID) in our app tables, not the other way around.

References:

- [Local Install Guide](https://convex-better-auth.netlify.app/features/local-install)
- [Migration Guide](https://convex-better-auth.netlify.app/migrations/migrate-userid) - We follow "Track component user id in app table"

1. Create the component definition:

```ts
// convex/betterAuth/convex.config.ts
import { defineComponent } from "convex/server";

const component = defineComponent("betterAuth");
export default component;
```

2. Generate the Better Auth schema:

```bash
cd convex/betterAuth
npx @better-auth/cli generate -y
```

3. Export adapter functions:

```ts
// convex/betterAuth/adapter.ts
import { createApi } from "@convex-dev/better-auth";
import schema from "./schema";
import { createAuth } from "../auth";

export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createApi(schema, createAuth);
```

4. Update `convex/auth.ts` to use local install with triggers:

```ts
// convex/auth.ts
import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import { getStaticAuth } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import authSchema from "./betterAuth/schema";
import { betterAuth } from "better-auth";

const siteUrl = process.env.SITE_URL!;

export const createAuth = (
  ctx: any,
  { optionsOnly } = { optionsOnly: false }
) => {
  return betterAuth({
    logger: { disabled: optionsOnly },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex()],
  });
};

// Static auth for schema generation
export const auth = getStaticAuth(createAuth);

const authFunctions: AuthFunctions = internal.betterAuth.auth as any;

// Create component client with triggers
// NOTE: We DO NOT configure 'userId' tracking in the component.
// Instead, we store component user.id in our app tables (profiles, businesses, etc.)
// This is the recommended future-proof pattern per:
// https://convex-better-auth.netlify.app/migrations/migrate-userid
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: { schema: authSchema },
    authFunctions,
    triggers: {
      user: {
        // Auto-create profile when user signs up
        // We store Better Auth user.id in profiles.userId (component ID → app table)
        onCreate: async (ctx, user) => {
          await ctx.db.insert("profiles", {
            userId: user.id, // Component user ID stored in app table
            role: "consumer", // Default role
            createdAt: Date.now(),
          });
        },
        // Clean up profile on user deletion
        onDelete: async (ctx, user) => {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", user.id))
            .unique();
          if (profile) {
            await ctx.db.delete(profile._id);
          }
        },
      },
    },
  }
);

// Export trigger functions
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

// Helper to get current user with profile
// This joins Better Auth user (component) with our profiles table (app)
// using user.id → profiles.userId (recommended pattern)
export const getCurrentUser = async (ctx: any) => {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) return null;

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", user.id))
    .unique();

  return { ...user, profile };
};
```

5. Update component registration in `convex/convex.config.ts`:

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config"; // Local install
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

6. Export the static auth instance for CLI schema generation:

```ts
// convex/betterAuth/auth.ts
import { createAuth } from "../auth";
import { getStaticAuth } from "@convex-dev/better-auth";

export const auth = getStaticAuth(createAuth);
```

## Geospatial indexing (Convex component)

Use the Convex Geospatial component for efficient nearby queries. This replaces coarse bounding-box hacks for MVP.

- Install and register the component (beta) — see docs: https://www.convex.dev/components/geospatial

```bash
pnpm add @convex-dev/geospatial
```

Then enable it in `convex/convex.config.ts`:

```ts
// convex/convex.config.ts
import geospatial from "@convex-dev/geospatial/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(geospatial);
export default app;
```

Create an index instance you can call from queries/mutations:

```ts
// convex/geospatial.ts
import { GeospatialIndex } from "@convex-dev/geospatial";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const geospatial = new GeospatialIndex<
  Id<"businesses">,
  { category?: string }
>(components.geospatial);
```

Insert and query:

```ts
// Insert a business location
await geospatial.insert(
  ctx,
  businessId,
  { latitude: 40.7813, longitude: -73.9737 },
  { category: "coffee" },
  /* sortKey */ undefined
);

// Query nearest N or within rectangle
const nearest = await geospatial.queryNearest(
  ctx,
  { latitude: lat, longitude: lng },
  20, // max results
  10000 // optional max distance (meters)
);
```

## Convex Functions & HTTP

Directory structure and responsibilities:

### Plaid Integration

**`convex/plaid/encryption.ts`** (Node.js helpers):

```ts
"use node";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error("ENCRYPTION_SECRET must be 64 hex characters");
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

**`convex/plaid/linkToken.ts`** (action): Generate Plaid Link token

```ts
"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";
import { authComponent } from "../auth";

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV!],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
    },
  })
);

export const createLinkToken = action({
  args: {},
  returns: v.object({ linkToken: v.string() }),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "No Punch Cards",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: `${process.env.SITE_URL}/api/plaid/webhook`,
    });

    return { linkToken: response.data.link_token };
  },
});
```

**`convex/plaid/exchangeToken.ts`** (action): Exchange public token → access token; encrypt and store

```ts
"use node";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { encrypt } from "./encryption";
import { authComponent } from "../auth";

// Pseudocode:
// 1. Get authenticated user
// 2. Exchange public token for access token via Plaid API
// 3. Encrypt access token with AES-256-GCM
// 4. Get account details from Plaid
// 5. Store encrypted token + metadata in plaidAccounts table
// 6. Schedule initial transaction sync
// 7. Return itemId
```

**`convex/plaid/webhookVerification.ts`** (Node.js helper):

```ts
"use node";
import crypto from "crypto";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const plaidClient = new PlaidApi(/* config */);

export async function verifyPlaidWebhook(
  body: string,
  signature: string,
  keyId: string
): Promise<boolean> {
  // Pseudocode:
  // 1. Extract keyId from signature header (format: t=timestamp,v1=sig,kid=keyId)
  // 2. Call Plaid /webhook_verification_key/get with keyId
  // 3. Get public key from response
  // 4. Verify signature using RSA-SHA256 with public key
  // 5. Return true if valid, false otherwise

  const response = await plaidClient.webhookVerificationKeyGet({
    key_id: keyId,
  });
  const { key } = response.data;

  const verify = crypto.createVerify("RSA-SHA256");
  verify.update(body);
  return verify.verify(key.key, signature, "base64");
}
```

**`convex/plaid/syncTransactions.ts`** (internal action): Fetch and upsert transactions

```ts
"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// Pseudocode:
// 1. Get plaidAccount by itemId
// 2. Decrypt access token
// 3. Call Plaid /transactions/sync endpoint with cursor
// 4. For each transaction:
//    a. Check if exists by plaidTransactionId
//    b. If exists and amount/date changed, update
//    c. If new, insert with status: "unmatched"
// 5. Update lastSyncedAt and cursor
// 6. If has more pages, schedule next sync
// 7. Schedule matching job for new transactions
```

**`convex/http.ts`** (HTTP router): Plaid & Resend webhooks

```ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent, createAuth } from "./auth";
import { resendComponent } from "./sendEmails";

const http = httpRouter();

// Better Auth routes
authComponent.registerRoutes(http, createAuth);

// Plaid webhook with JWS verification
http.route({
  path: "/api/plaid/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Pseudocode:
    // 1. Get signature from Plaid-Verification header
    // 2. Extract keyId from signature
    // 3. Read request body as text
    // 4. Verify signature using verifyPlaidWebhook()
    // 5. If invalid, return 401
    // 6. Parse webhook payload
    // 7. Switch on webhook_code:
    //    - INITIAL_UPDATE/HISTORICAL_UPDATE/DEFAULT_UPDATE:
    //      Schedule syncTransactions with itemId
    // 8. Return 200
  }),
});

// Resend webhook
http.route({
  path: "/api/resend/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resendComponent.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
```

### Matching Engine

**`convex/matching/matchTransaction.ts`** (internal mutation):

```ts
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const matchTransaction = internalMutation({
  args: { transactionId: v.id("transactions") },
  returns: v.union(v.id("businesses"), v.null()),
  handler: async (ctx, args) => {
    // Pseudocode:
    // 1. Get transaction by ID
    // 2. If already matched, return existing businessId
    // 3. Get all businesses (or filter by likely matches)
    // 4. Score each business:
    //    a. Exact name match = 100 points
    //    b. Fuzzy name match (Levenshtein < 3) = 80 points
    //    c. merchantName contains business.name = 60 points
    //    d. MCC code match (if business has mccCodes) = 40 points
    //    e. Location within 1km (if available) = 30 points
    // 5. If highest score > threshold (e.g., 80), return that businessId
    // 6. Otherwise return null (unmatched)
  },
});
```

**`convex/matching/calculateRewards.ts`** (internal mutation):

```ts
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const calculateRewards = internalMutation({
  args: {
    userId: v.string(),
    businessId: v.id("businesses"),
    transactionId: v.id("transactions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Pseudocode:
    // 1. Get active reward programs for businessId
    // 2. For each program:
    //    a. Get or create rewardProgress for (userId, programId)
    //    b. Increment currentVisits
    //    c. Add transactionId to transactionIds array
    //    d. Check if currentVisits >= program.rules.visits
    //    e. If threshold reached:
    //       - Set status: "completed"
    //       - Increment totalEarned
    //       - Schedule notification (reward earned!)
    //       - Create new rewardProgress for next cycle
    // 3. Update lastVisitDate
  },
});
```

**`convex/crons.ts`** (scheduled jobs):

```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process unmatched transactions every 5 minutes
crons.interval(
  "process unmatched transactions",
  { minutes: 5 },
  internal.matching.processNewTransactions,
  {}
);

export default crons;
```

**`convex/matching/processNewTransactions.ts`** (internal action):

```ts
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const processNewTransactions = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Pseudocode:
    // 1. Query transactions with status: "unmatched" (limit 100)
    // 2. For each transaction:
    //    a. Call matchTransaction mutation
    //    b. If businessId returned:
    //       - Update transaction: businessId, status: "matched"
    //       - Call calculateRewards mutation
    // 3. If processed 100, schedule another run immediately
  },
});
```

### Users & Roles

**`convex/users.ts`**:

```ts
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, getCurrentUser } from "./auth";

// Get current user with profile
export const getCurrentUserWithProfile = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Admin-only: Set user role
export const setUserRole = mutation({
  args: {
    userId: v.string(),
    role: v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { role: args.role });
  },
});

// Helper: Require specific role(s)
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"consumer" | "business_owner" | "admin">
) {
  const userWithProfile = await getCurrentUser(ctx);

  if (!userWithProfile) {
    throw new Error("Not authenticated");
  }

  if (!userWithProfile.profile) {
    throw new Error("Profile not found");
  }

  if (!allowedRoles.includes(userWithProfile.profile.role)) {
    throw new Error(`Forbidden: Requires one of [${allowedRoles.join(", ")}]`);
  }

  return userWithProfile;
}
```

Notifications:

- `convex/notifications/send.ts` (mutation): Create record and send via Push and/or Email.
- `convex/notifications/subscribe.ts` (mutation): Save push subscription.
- `convex/notifications/markRead.ts` (mutation): Mark as read.

Security:

- Enforce auth in every mutation/action; only owners can manage their businesses/programs; only the user can manage their Plaid link.
- Idempotency: upserts on `plaidTransactionId` (check existing first); dedupe webhook deliveries.
- Encryption: access tokens are encrypted with `ENCRYPTION_SECRET`; never sent to client.
- Webhook verification: implement JWS verification using Plaid’s recommended method.

## App Routes & Acceptance Criteria

Business (`src/routes/business/`):

- `register.tsx`
  - AC: Authenticated user can submit name/category/address → `businesses` row created `status=unverified`, `ownerId` set to user.
- `dashboard.tsx`
  - AC: Shows counts (total customers, total visits, active rewards) via Convex queries.
- `rewards/index.tsx`
  - AC: Lists reward programs; shows status; can navigate to create/edit.
- `rewards/create.tsx`
  - AC: Validates inputs; creates `rewardPrograms` with `rules.visits` and `rules.reward`.
- `analytics.tsx`
  - AC: Charts visits over time (basic), top customers.
- `settings.tsx`
  - AC: Edit business profile, upload logo URL, view verification status.

Consumer (`src/routes/consumer/`):

- `onboarding.tsx`
  - AC: Starts Plaid Link; on success, calls `exchangeToken`; redirects to dashboard.
- `dashboard.tsx`
  - AC: Lists active `rewardProgress` (e.g., “3/5 visits”) and recent matched transactions.
- `merchants.tsx`
  - AC: Shows participating businesses; filter by category; optional map later.
  - AC: Nearby view returns businesses using geospatial `queryNearest` by current location.
- `rewards.tsx`
  - AC: Shows active and completed rewards.
- `transactions.tsx`
  - AC: Lists matched transactions; filter by business/date; unmatch (sets `businessId=null`, `status=unmatched`).
- `settings.tsx`
  - AC: Manage push notifications, linked accounts, disconnect Plaid.

### Route Protection (TanStack Start)

Use `beforeLoad` in route definitions to protect routes by role:

**`src/routes/consumer/dashboard.tsx`**:

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { authComponent } from "../../convex/auth";

const requireConsumer = createServerFn({ method: "GET" }).handler(async () => {
  const { getCurrentUser } = await import("../../convex/auth");
  const user = await getCurrentUser(/* ctx from request */);

  if (!user) {
    throw redirect({ to: "/login" });
  }

  if (user.profile?.role !== "consumer") {
    throw redirect({ to: "/business/dashboard" });
  }

  return user;
});

export const Route = createFileRoute("/consumer/dashboard")({
  beforeLoad: async () => {
    await requireConsumer();
  },
  component: ConsumerDashboard,
});

function ConsumerDashboard() {
  // Component implementation
}
```

**`src/routes/business/dashboard.tsx`**:

```tsx
// Similar pattern but check for role: "business_owner"
// Redirect to /consumer/dashboard if not business owner
```

**Shared helper** (`src/lib/routeProtection.ts`):

```ts
import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

export const requireRole = (
  allowedRoles: Array<"consumer" | "business_owner" | "admin">
) =>
  createServerFn({ method: "GET" }).handler(async () => {
    const { getCurrentUser } = await import("../../convex/auth");
    const user = await getCurrentUser(/* ctx */);

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (!user.profile || !allowedRoles.includes(user.profile.role)) {
      throw redirect({ to: "/unauthorized" });
    }

    return user;
  });
```

## PWA & Push Notifications

### Vite PWA Setup

**`vite.config.ts`**:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { tanStackStartPlugin } from "@netlify/vite-plugin-tanstack-start";

export default defineConfig({
  plugins: [
    react(),
    tanStackStartPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo192.png", "logo512.png"],
      manifest: {
        name: "No Punch Cards",
        short_name: "NoPunchCards",
        description: "Loyalty rewards without the cards",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "logo192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/api\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "convex-api-cache",
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

### Push Subscription (Client)

**`src/lib/pushNotifications.ts`**:

```ts
import { api } from "../../convex/_generated/api";
import { useConvex } from "convex/react";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export async function subscribeToPush(convex: any) {
  // Pseudocode:
  // 1. Check if service worker is registered
  // 2. Request notification permission
  // 3. If granted, get service worker registration
  // 4. Subscribe to push manager with VAPID public key
  // 5. Extract endpoint, p256dh, and auth keys
  // 6. Call Convex mutation to save subscription

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers not supported");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await convex.mutation(api.notifications.subscribe, {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
      auth: arrayBufferToBase64(subscription.getKey("auth")!),
    },
  });
}
```

### Push Delivery (Server)

**`convex/notifications/send.ts`**:

```ts
"use node";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import webpush from "web-push";

webpush.setVapidDetails(
  `mailto:support@nopunchcards.com`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const sendPushNotification = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Pseudocode:
    // 1. Get all push subscriptions for userId
    // 2. For each subscription:
    //    a. Format push payload: { title, body, icon, data }
    //    b. Send via webpush.sendNotification()
    //    c. If subscription expired (410), delete it
    // 3. Also create notification record in DB
  },
});
```

## Email (Resend) — Convex component

Use the official Resend Convex component for reliable, queued email delivery, batching, idempotency, and webhooks. Reference: [Resend Convex Component](https://www.convex.dev/components/resend).

1. Install the package

```bash
pnpm add @convex-dev/resend
```

2. Register the component in `convex/convex.config.ts`

```ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);
export default app;
```

3. Create a small helper in `convex/sendEmails.ts`

```ts
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";

export const resendComponent = new Resend(components.resend, {
  // testMode defaults to true; set false in prod to send real emails
  // testMode: false,
});

export const sendTestEmail = internalMutation({
  args: {},
  handler: async (ctx) => {
    await resendComponent.sendEmail(ctx, {
      from: "Me <test@mydomain.com>",
      to: "delivered@resend.dev",
      subject: "Hello from Resend",
      html: "<p>This is a test email</p>",
    });
  },
});
```

4. Webhook (delivery/bounce/spam events) in `convex/http.ts`

```ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { resendComponent } from "./sendEmails";

const http = httpRouter();

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resendComponent.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
```

- Configure the webhook URL in the Resend dashboard and set `RESEND_WEBHOOK_SECRET` in your Convex env.
- Keep `testMode` true during development; set `testMode: false` in production to send to real addresses.

## Billing (Autumn) — Required in MVP

Use Autumn for plan gating from the start:

- **Free**: 1 active program, ≤50 customers/month
- **Pro/Enterprise**: lifted limits + features (branding, analytics, export)

Reference: https://docs.useautumn.com/setup/convex

### 1. Install Packages

```bash
pnpm add autumn-js @useautumn/convex atmn
npm i -g atmn  # Autumn CLI for pricing-as-code
```

### 2. Define Pricing as Code

**`autumn.config.ts`** (project root):

```ts
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
  type: "continuous_use", // Limits concurrent active programs
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
      included_usage: 1, // 1 active program max
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
    featureItem({
      feature_id: rewardPrograms.id,
      included_usage: null, // null = unlimited
    }),
    featureItem({
      feature_id: monthlyCustomers.id,
      included_usage: 500,
      interval: "month",
    }),
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

### 3. Push Pricing Config to Autumn

```bash
npx atmn init  # First time only - sets up auth
npx atmn push  # Uploads pricing config to Autumn
```

### 4. Set Convex Environment Variable

```bash
npx convex env set AUTUMN_SECRET_KEY "<autumn_secret_key>"
```

### 5. Initialize Autumn in Convex

**`convex/autumn.ts`**:

```ts
import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";
import { authComponent } from "./auth";

export const autumn = new Autumn(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY ?? "",
  identify: async (ctx: any) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    return {
      customerId: user.id,
      customerData: {
        name: user.name as string,
        email: user.email as string,
      },
    };
  },
});

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

### 6. Frontend Provider Setup

**`src/lib/AutumnWrapper.tsx`**:

```tsx
"use client";
import { AutumnProvider } from "autumn-js/react";
import { api } from "../../convex/_generated/api";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "./auth-clients";
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
          return convexJwtPart.split("=")[1];
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

### 7. Server-Side Feature Gating

**`convex/rewards/create.ts`**:

```ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { check, track } from "../autumn";
import { requireRole } from "../users";

export const createRewardProgram = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    rules: v.object({ visits: v.number(), reward: v.string() }),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["business_owner"]);

    // Check if user can create more programs
    const { data, error } = await check(ctx, {
      featureId: "reward_programs_active",
    });

    if (error || !data.allowed) {
      throw new Error(
        `Upgrade your plan to create more reward programs. ` +
          `Current usage: ${data.balance || 0}/${data.included_usage || 1}`
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

    // Track usage
    await track(ctx, {
      featureId: "reward_programs_active",
      value: 1,
    });

    return programId;
  },
});
```

### 8. Client-Side Paywall

**`src/components/CreateRewardButton.tsx`**:

```tsx
import { useCustomer, PaywallDialog } from "autumn-js/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function CreateRewardButton() {
  const { check } = useCustomer();
  const createProgram = useMutation(api.rewards.create.createRewardProgram);

  const handleCreate = async () => {
    // Check client-side first (with upgrade prompt if needed)
    const { data } = await check({
      featureId: "reward_programs_active",
      dialog: PaywallDialog, // Shows upgrade UI if not allowed
    });

    if (data.allowed) {
      await createProgram({
        businessId: /* ... */,
        name: /* ... */,
        rules: /* ... */,
      });
    }
  };

  return <button onClick={handleCreate}>Create Reward Program</button>;
}
```

## Testing Matrix (MVP)

- Plaid Sandbox: link → initial sync → default update → transaction arrives → matched → progress increments → notification sent.
- Edge cases: duplicate webhook, pending → posted transitions, refunds/negative amounts, unknown merchants (remain `unmatched`).
- Authorization: business owner cannot modify other owners’ businesses; consumers cannot access business mutations.
- PWA: installable; push permission prompt; receive a test notification.
- Geospatial: nearest queries return deterministic results for a fixed seed location; paginate via cursors.
- Billing: Autumn `check` denies when over plan limits; checkout upgrades and subsequent `check` allows.
- Email: Resend test email delivered to `delivered@resend.dev`; webhook events received; production sends only after `testMode` disabled and domain verified.

## Risks & Potential Blockers (with mitigations)

- Plaid webhook verification: must implement JWS verification; without it, disable prod webhooks.
- Encryption of access tokens: required for security; ensure `ENCRYPTION_SECRET` is set before linking Plaid.
- Geospatial component is beta: validate on our dataset and add tests; fall back to category/city lists if issues arise.
- Email deliverability: verify sending domain (SPF/DKIM) early; default `testMode` prevents sending to arbitrary addresses until disabled.
- Web Push in production: requires HTTPS and correct VAPID keys; secure domain early.
- Idempotency: dedupe by `plaidTransactionId` to avoid double-counting on retries.
- Scheduling: ensure Convex scheduled functions are configured for every-5-mins job.

## Step-by-Step Checklist (Definition of Done)

0. Environment setup

- [ ] Dev deployment: all required Convex env vars set (Plaid sandbox, Resend, Autumn, VAPID, ENCRYPTION_SECRET).
- [ ] Prod deployment: placeholders filled and env vars set prior to launch.

1. Schema

- [ ] `convex/schema.ts` created; all tables and indexes compile on `convex dev`.

2. Plaid integration

- [ ] `linkToken` and `exchangeToken` working in sandbox.
- [ ] `http.ts` webhook endpoint with signature verification.
- [ ] `syncTransactions` pulls and upserts transactions idempotently.

3. Matching & rewards

- [ ] `processNewTransactions` scheduled; unmatched → matched logic functional.
- [ ] `calculateRewards` increments visit-based progress correctly; unit tests for matching rules.

4. Consumer UX

- [ ] Onboarding links Plaid; dashboard shows progress and recent activity.

5. Business UX

- [ ] Register flow, dashboard stats, rewards CRUD, basic analytics, settings.

6. Notifications

- [ ] Push subscription storage; push and email notifications for reward earned.
- [ ] `@convex-dev/resend` installed & registered; test email mutation works.
- [ ] Resend webhook configured; `RESEND_WEBHOOK_SECRET` set; events recorded.
- [ ] `testMode` disabled in staging/prod after domain verification.

7. Geospatial

- [ ] `@convex-dev/geospatial` installed & registered; merchants nearby view returns results.

8. PWA

- [ ] Manifest, service worker, installable; auto-update enabled.

9. Roles & authz

- [ ] `setUserRole`, `getCurrentUserRole`, and route protection in place.

10. Billing (required)

- [ ] `AUTUMN_SECRET_KEY` set; component registered; checkout renders; plan limits enforced via server.

11. Readiness

- [ ] Error handling and logging present in all server functions.
- [ ] Basic CI (typecheck, build) green; environment variables present in prod.

## Commands Reference

```bash
# Install deps
pnpm install

# Dev servers
pnpm dev
pnpm dlx convex dev

# Add required packages (already listed in plan)
pnpm add plaid web-push vite-plugin-pwa @convex-dev/geospatial @convex-dev/resend resend autumn-js @useautumn/convex atmn
pnpm add -D @types/web-push
npm i -g atmn  # Autumn CLI

# Generate Better Auth schema (after Local Install setup)
cd convex/betterAuth
npx @better-auth/cli generate -y
cd ../..
```

## Notes & Conventions

- **User IDs**: All app tables use `userId: v.string()` storing Better Auth's `user.id` (component user ID). This follows the recommended pattern per the [migration guide](https://convex-better-auth.netlify.app/migrations/migrate-userid). Never track app user IDs in the Better Auth component tables.
- **Amounts**: Store in integer cents to avoid floating point issues.
- **Time**: Store `createdAt` as epoch ms; store transaction dates as ISO `YYYY-MM-DD`.
- **Idempotency**: Read-before-write on `plaidTransactionId`-indexed query.
- **Data privacy**: Never send Plaid access tokens to client; restrict queries by `auth.userId`.

---

Playbook last updated: 2025-11-08T13:00:00Z
