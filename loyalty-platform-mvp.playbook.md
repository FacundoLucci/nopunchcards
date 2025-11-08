<!-- Playbook generated: 2025-11-08T00:00:00Z -->

# Loyalty Platform MVP — Execution Playbook (All-in-One)

This document is the single source of truth to execute the MVP end-to-end. It includes prerequisites, local setup, environment variables, schema, Convex functions, routes, acceptance criteria, risks/blockers, and a step-by-step checklist.

## Scope & Outcomes

- Tech stack: TanStack Start + Convex + Better Auth + Plaid + Autumn (Stripe billing) + PWA + Resend.
- Core flow: Plaid webhooks → Transaction matching → Reward progress → Notifications.
- Goal: Functional MVP in sandbox mode with clear "Definition of Done" per phase.

## Design System & UI Requirements

**📋 REQUIRED READING**: `loyalty-platform-design.md`

Before implementing any frontend code, review the complete design system document which defines:

- **Color System**: OKLCH-based (matches existing `styles.css`)
- **Layout Strategy**: Mobile-first with desktop constrained to 480px max-width
- **Theme**: Light mode primary (clean white bg with elevated cards), dark mode available
- **Navigation**: No hamburger menu - profile icon + bottom nav only
- **Component Patterns**: Bottom sheets (mobile) → Centered modals (desktop)
- **User Flows**: Detailed multistep forms, one action per screen
- **Copy**: "Link your card" not "Connect your bank"

### Key Design Principles for Implementation

1. **Mobile-First, Desktop-Centered**

   ```tsx
   // All app screens (dashboard, settings, etc.)
   <div className="max-w-[480px] mx-auto px-4">
     {children}
   </div>

   // Landing page only - can use full width
   <div className="max-w-7xl mx-auto px-6">
     {children}
   </div>
   ```

2. **Playful Cards (Light Mode)**

   ```tsx
   // Cards get subtle rotation and shadows
   <div className="bg-card rounded-lg p-6 shadow-md rotate-[-0.5deg] hover:rotate-0">
     {content}
   </div>
   ```

3. **Responsive Modals/Sheets**

   ```tsx
   // Same component adapts to screen size
   <div className="fixed inset-0 flex items-end md:items-center md:justify-center">
     <div
       className="w-full md:w-auto md:min-w-[480px] md:max-w-2xl 
                     rounded-t-xl md:rounded-xl"
     >
       {/* Drag handle on mobile only */}
       <div className="md:hidden w-12 h-1 bg-gray-700 rounded-full" />
       {content}
     </div>
   </div>
   ```

4. **Consistent Copy**
   - ✅ "Link your card", "Link the card you use most"
   - ❌ "Connect your bank", "Link your bank account"

### Implementation Checklist Integration

When implementing routes in the checklist below, ensure:

- [ ] All routes use constrained max-width layout (480px)
- [ ] Bottom sheets transform to centered modals on desktop
- [ ] Cards have playful rotation in light mode
- [ ] No hamburger menus - use profile icon + bottom nav
- [ ] Copy references cards, not banks
- [ ] OKLCH colors from design system used throughout

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

### Convex Environment Variables (Backend)

All backend secrets live in Convex env (never exposed to client). Generate or obtain the following and set them:

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

# Better Auth site URL (required for auth to work)
npx convex env set SITE_URL "http://localhost:3000"
npx convex env set CONVEX_SITE_URL "http://localhost:3000"
```

### Client Environment Variables (.env.local)

Create `.env.local` in project root with public/client-safe values only:

```bash
# .env.local
# Convex deployment URL (from npx convex dev output)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# VAPID public key for Web Push (generated with npx web-push generate-vapid-keys)
VITE_VAPID_PUBLIC_KEY=<your_vapid_public_key>
```

**Important**: Never put secrets in `.env.local` - they are bundled into client code!

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
    syncCursor: v.optional(v.string()), // For Plaid /transactions/sync pagination
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_item", ["plaidItemId"]),

  transactions: defineTable({
    plaidTransactionId: v.string(),
    userId: v.string(), // Better Auth user.id (component user ID)
    plaidAccountId: v.id("plaidAccounts"),
    amount: v.number(), // Integer cents (e.g., $5.00 = 500)
    currency: v.string(), // ISO currency code (e.g., "USD")
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
    .index("by_plaid_tx", ["plaidTransactionId"])
    .index("by_status", ["status"]), // For scheduled matching job

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

export const exchangePublicToken = action({
  args: { publicToken: v.string() },
  returns: v.object({ itemId: v.string() }),
  handler: async (ctx, args) => {
    // 1. Get authenticated user from Better Auth
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // 2. Exchange public token for access token via Plaid /item/public_token/exchange
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: args.publicToken,
    });
    const accessToken = exchangeResponse.data.access_token;
    const plaidItemId = exchangeResponse.data.item_id;

    // 3. Encrypt access token with AES-256-GCM using ENCRYPTION_SECRET env var
    const encryptedToken = encrypt(accessToken);

    // 4. Get account details from Plaid /accounts/get
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    const accounts = accountsResponse.data.accounts;
    const accountIds = accounts.map((a) => a.account_id);
    const institutionName = accountsResponse.data.item.institution_id;

    // 5. Store encrypted token + metadata in plaidAccounts table
    await ctx.runMutation(internal.plaid.savePlaidAccount, {
      userId: user.id,
      plaidItemId,
      plaidAccessTokenCiphertext: encryptedToken,
      accountIds,
      institutionName,
    });

    // 6. Schedule initial transaction sync (run immediately with runAfter(0))
    await ctx.scheduler.runAfter(0, internal.plaid.syncTransactions, {
      plaidItemId,
    });

    // 7. Return itemId for client-side confirmation
    return { itemId: plaidItemId };
  },
});
```

**`convex/plaid/webhookVerification.ts`** (Node.js helper):

```ts
"use node";
import crypto from "crypto";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

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

export async function verifyPlaidWebhook(
  bodyText: string,
  signatureHeader: string,
  keyId: string
): Promise<boolean> {
  // 1. keyId already extracted by caller from signature header
  //    Format: "t=1234567890,v1=<base64_signature>,kid=<key_id>"

  // 2. Call Plaid /webhook_verification_key/get with keyId
  //    This returns the public key for verifying the signature
  const response = await plaidClient.webhookVerificationKeyGet({
    key_id: keyId,
  });
  const publicKeyObject = response.data.key;

  // 3. Extract signature from header (v1= part)
  const signatureMatch = signatureHeader.match(/v1=([^,]+)/);
  if (!signatureMatch) {
    throw new Error("Invalid signature header format");
  }
  const signature = signatureMatch[1];

  // 4. Verify signature using RSA-SHA256 with Plaid's public key
  const verify = crypto.createVerify("RSA-SHA256");
  verify.update(bodyText); // Original request body as text

  // 5. Return true if signature is valid, false otherwise
  return verify.verify(publicKeyObject.key, signature, "base64");
}
```

**`convex/plaid/syncTransactions.ts`** (internal action): Fetch and upsert transactions using /transactions/sync

```ts
"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { decrypt } from "./encryption";

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

export const syncTransactions = internalAction({
  args: { plaidItemId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get plaidAccount record by itemId using by_item index
    const account = await ctx.runQuery(internal.plaid.getAccountByItemId, {
      plaidItemId: args.plaidItemId,
    });
    if (!account) {
      throw new Error(
        `Plaid account not found for itemId: ${args.plaidItemId}`
      );
    }

    // 2. Decrypt access token using ENCRYPTION_SECRET (AES-256-GCM)
    const accessToken = decrypt(account.plaidAccessTokenCiphertext);

    // 3. Call Plaid /transactions/sync endpoint with stored cursor
    //    Uses cursor-based pagination (more efficient than date ranges)
    const syncResponse = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: account.syncCursor || undefined, // undefined for initial sync
      options: {
        include_personal_finance_category: true, // Get enriched categories
      },
    });

    const { added, modified, removed, next_cursor, has_more } =
      syncResponse.data;

    // 4. Process added transactions (new since last sync)
    for (const plaidTx of added) {
      // 4a. Check if transaction already exists by plaidTransactionId index (idempotency)
      const existingTx = await ctx.runQuery(
        internal.plaid.getTransactionByPlaidId,
        {
          plaidTransactionId: plaidTx.transaction_id,
        }
      );

      // 4b. If exists, skip (defensive - shouldn't happen with sync cursor)
      if (existingTx) {
        console.warn(`Transaction already exists: ${plaidTx.transaction_id}`);
        continue;
      }

      // 4c. Insert new transaction with status: "unmatched"
      await ctx.runMutation(internal.plaid.insertTransaction, {
        plaidTransactionId: plaidTx.transaction_id,
        userId: account.userId,
        plaidAccountId: account._id,
        amount: Math.round(plaidTx.amount * 100), // Convert dollars → cents integer
        currency: plaidTx.iso_currency_code || "USD",
        merchantName: plaidTx.merchant_name || plaidTx.name || undefined,
        date: plaidTx.date, // Already in YYYY-MM-DD format from Plaid
        category: plaidTx.personal_finance_category
          ? [plaidTx.personal_finance_category.primary]
          : undefined,
        status: "unmatched",
      });
    }

    // 5. Process modified transactions (amount/date changed after posting)
    for (const plaidTx of modified) {
      const existingTx = await ctx.runQuery(
        internal.plaid.getTransactionByPlaidId,
        {
          plaidTransactionId: plaidTx.transaction_id,
        }
      );

      if (existingTx) {
        await ctx.runMutation(internal.plaid.updateTransaction, {
          transactionId: existingTx._id,
          amount: Math.round(plaidTx.amount * 100),
          merchantName: plaidTx.merchant_name || plaidTx.name || undefined,
          date: plaidTx.date,
          // Note: Don't change status or businessId on modification
        });
      }
    }

    // 6. Process removed transactions (refunds, reversals)
    for (const removedTx of removed) {
      const existingTx = await ctx.runQuery(
        internal.plaid.getTransactionByPlaidId,
        {
          plaidTransactionId: removedTx.transaction_id,
        }
      );

      if (existingTx) {
        // Mark as removed rather than deleting (keeps audit trail)
        await ctx.runMutation(internal.plaid.markTransactionRemoved, {
          transactionId: existingTx._id,
        });
      }
    }

    // 7. Update plaidAccount with lastSyncedAt timestamp and new cursor
    await ctx.runMutation(internal.plaid.updateSyncMetadata, {
      accountId: account._id,
      lastSyncedAt: Date.now(),
      syncCursor: next_cursor,
    });

    // 8. If has_more=true, there are more transactions - schedule continuation
    if (has_more) {
      await ctx.scheduler.runAfter(0, internal.plaid.syncTransactions, {
        plaidItemId: args.plaidItemId,
      });
    }

    // 9. If we added new transactions, schedule matching job
    if (added.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.matching.processNewTransactions,
        {}
      );
    }

    return null;
  },
});
```

**Supporting internal functions** (referenced above):

```ts
// convex/plaid/helpers.ts
import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getAccountByItemId = internalQuery({
  args: { plaidItemId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("plaidAccounts"),
      userId: v.string(),
      plaidAccessTokenCiphertext: v.string(),
      syncCursor: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plaidAccounts")
      .withIndex("by_item", (q) => q.eq("plaidItemId", args.plaidItemId))
      .unique();
  },
});

export const getTransactionByPlaidId = internalQuery({
  args: { plaidTransactionId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("transactions"),
      businessId: v.optional(v.id("businesses")),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_plaid_tx", (q) =>
        q.eq("plaidTransactionId", args.plaidTransactionId)
      )
      .unique();
  },
});

export const savePlaidAccount = internalMutation({
  args: {
    userId: v.string(),
    plaidItemId: v.string(),
    plaidAccessTokenCiphertext: v.string(),
    accountIds: v.array(v.string()),
    institutionName: v.string(),
  },
  returns: v.id("plaidAccounts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("plaidAccounts", {
      ...args,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const insertTransaction = internalMutation({
  args: {
    plaidTransactionId: v.string(),
    userId: v.string(),
    plaidAccountId: v.id("plaidAccounts"),
    amount: v.number(),
    currency: v.string(),
    merchantName: v.optional(v.string()),
    date: v.string(),
    category: v.optional(v.array(v.string())),
    status: v.literal("unmatched"),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateTransaction = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    amount: v.number(),
    merchantName: v.optional(v.string()),
    date: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { transactionId, ...updates } = args;
    await ctx.db.patch(transactionId, updates);
    return null;
  },
});

export const markTransactionRemoved = internalMutation({
  args: { transactionId: v.id("transactions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Add status: "removed" to transaction schema if needed
    await ctx.db.delete(args.transactionId); // Or mark as removed
    return null;
  },
});

export const updateSyncMetadata = internalMutation({
  args: {
    accountId: v.id("plaidAccounts"),
    lastSyncedAt: v.number(),
    syncCursor: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, {
      lastSyncedAt: args.lastSyncedAt,
      syncCursor: args.syncCursor,
    });
    return null;
  },
});
```

**`convex/http.ts`** (HTTP router): Plaid & Resend webhooks

```ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent, createAuth } from "./auth";
import { resendComponent } from "./sendEmails";
import { verifyPlaidWebhook } from "./plaid/webhookVerification";

const http = httpRouter();

// Better Auth routes (handles all /api/auth/* endpoints)
authComponent.registerRoutes(http, createAuth);

// Plaid webhook with JWS verification (required for security)
http.route({
  path: "/api/plaid/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Get Plaid-Verification header containing JWS signature
    const plaidVerification = request.headers.get("Plaid-Verification");
    if (!plaidVerification) {
      console.error("Missing Plaid-Verification header");
      return new Response("Unauthorized: Missing signature", { status: 401 });
    }

    // 2. Extract keyId from signature header
    //    Header format: "t=1234567890,v1=<signature>,kid=<key_id>"
    const keyIdMatch = plaidVerification.match(/kid=([^,]+)/);
    if (!keyIdMatch) {
      console.error("Invalid Plaid-Verification header format");
      return new Response("Invalid signature format", { status: 401 });
    }
    const keyId = keyIdMatch[1];

    // 3. Read request body as text (needed for signature verification)
    const bodyText = await request.text();

    // 4. Verify JWS signature using Plaid's public key
    const isValid = await verifyPlaidWebhook(
      bodyText,
      plaidVerification,
      keyId
    );
    if (!isValid) {
      console.error("Invalid Plaid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // 5. Parse verified webhook payload
    const payload = JSON.parse(bodyText);
    const { webhook_type, webhook_code, item_id } = payload;

    console.log(`Plaid webhook received: ${webhook_code} for item ${item_id}`);

    // 6. Handle different webhook codes
    switch (webhook_code) {
      case "INITIAL_UPDATE":
        // Initial transaction data is ready (right after Link)
        console.log("Initial update - scheduling sync");
        await ctx.scheduler.runAfter(0, internal.plaid.syncTransactions, {
          plaidItemId: item_id,
        });
        break;

      case "HISTORICAL_UPDATE":
        // Historical data finished loading (2+ years)
        console.log("Historical update complete - scheduling sync");
        await ctx.scheduler.runAfter(0, internal.plaid.syncTransactions, {
          plaidItemId: item_id,
        });
        break;

      case "DEFAULT_UPDATE":
        // New transaction data available (regular updates)
        console.log("Default update - scheduling sync");
        await ctx.scheduler.runAfter(0, internal.plaid.syncTransactions, {
          plaidItemId: item_id,
        });
        break;

      case "TRANSACTIONS_REMOVED":
        // Transactions were deleted/refunded (rare)
        console.log("Transactions removed - handling separately");
        // Could schedule a full re-sync or handle removed_transactions array
        break;

      default:
        console.log(`Unhandled Plaid webhook code: ${webhook_code}`);
    }

    // 7. Return 200 OK to acknowledge receipt
    return new Response("OK", { status: 200 });
  }),
});

// Resend webhook (email delivery/bounce/spam events)
http.route({
  path: "/api/resend/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Resend component handles HMAC verification internally using RESEND_WEBHOOK_SECRET
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
    // 1. Get transaction by _id from transactions table
    const tx = await ctx.db.get(args.transactionId);
    if (!tx) {
      throw new Error(`Transaction not found: ${args.transactionId}`);
    }

    // 2. If already matched, return existing businessId (idempotency)
    if (tx.businessId) {
      return tx.businessId;
    }

    // 3. If no merchant name from Plaid, cannot match
    if (!tx.merchantName) {
      return null;
    }

    // 4. Get all verified businesses from businesses table (status="verified")
    //    Could optimize later by filtering by category or location
    const businesses = await ctx.db
      .query("businesses")
      .withIndex("by_status", (q) => q.eq("status", "verified"))
      .collect();

    // 5. Score each business using multiple heuristics
    const scores = businesses.map((business) => {
      let score = 0;
      const txName = tx.merchantName!.toLowerCase().trim();
      const bizName = business.name.toLowerCase().trim();

      // 5a. Exact name match = 100 points (highest confidence)
      if (txName === bizName) {
        score += 100;
      }
      // 5b. Business name is substring of merchant name = 80 points
      //     Example: "Starbucks" matches "Starbucks #1234"
      else if (txName.includes(bizName)) {
        score += 80;
      }
      // 5c. Merchant name is substring of business name = 60 points
      else if (bizName.includes(txName)) {
        score += 60;
      }
      // 5d. Partial word match = 40 points
      //     Example: "Target Store" matches "Target"
      else {
        const txWords = txName.split(/\s+/);
        const bizWords = bizName.split(/\s+/);
        const commonWords = txWords.filter(
          (w) => bizWords.includes(w) && w.length > 3
        );
        if (commonWords.length > 0) {
          score += 40;
        }
      }

      // 5e. MCC code match (if transaction category and business mccCodes exist)
      //     TODO: Implement Plaid category → MCC code mapping
      //     For now: simplified category matching
      if (
        tx.category &&
        tx.category.length > 0 &&
        business.mccCodes &&
        business.mccCodes.length > 0
      ) {
        // This needs proper MCC mapping; placeholder for now
        score += 20;
      }

      // 5f. Location proximity (if both have coordinates)
      //     TODO: Use geospatial component or haversine distance
      //     Within 1km = 30 bonus points
      // if (tx.location && business.location) {
      //   const distanceKm = calculateHaversineDistance(
      //     tx.location.lat, tx.location.lng,
      //     business.location.lat, business.location.lng
      //   );
      //   if (distanceKm < 1) score += 30;
      // }

      return { business, score };
    });

    // 6. Sort by score descending to get best match first
    scores.sort((a, b) => b.score - a.score);

    // 7. If highest score >= 80 (confidence threshold), return that businessId
    const bestMatch = scores[0];
    const CONFIDENCE_THRESHOLD = 80;

    if (bestMatch && bestMatch.score >= CONFIDENCE_THRESHOLD) {
      console.log(
        `Matched tx ${tx.plaidTransactionId} to business "${bestMatch.business.name}" ` +
          `(score: ${bestMatch.score}, merchant: "${tx.merchantName}")`
      );
      return bestMatch.business._id;
    }

    // 8. No confident match found - remains unmatched
    console.log(
      `No match for tx ${tx.plaidTransactionId} ` +
        `(merchant: "${tx.merchantName}", best score: ${bestMatch?.score || 0})`
    );
    return null;
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
    // 1. Get all active reward programs for this businessId using by_business index
    const activePrograms = await ctx.db
      .query("rewardPrograms")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (activePrograms.length === 0) {
      return null; // No active programs for this business
    }

    // 2. Process each active reward program
    for (const program of activePrograms) {
      // 2a. Get existing active rewardProgress for (userId, programId)
      //     Use by_program index and filter by userId and status="active"
      let progress = await ctx.db
        .query("rewardProgress")
        .withIndex("by_program", (q) => q.eq("rewardProgramId", program._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), args.userId),
            q.eq(q.field("status"), "active")
          )
        )
        .unique();

      // Create new progress if doesn't exist
      if (!progress) {
        const progressId = await ctx.db.insert("rewardProgress", {
          userId: args.userId,
          businessId: args.businessId,
          rewardProgramId: program._id,
          currentVisits: 0,
          totalEarned: 0,
          transactionIds: [],
          status: "active",
          createdAt: Date.now(),
        });
        progress = (await ctx.db.get(progressId))!;
      }

      // 2b. Increment visit count
      const newVisitCount = progress.currentVisits + 1;

      // 2c. Add transactionId to array (audit trail)
      const updatedTxIds = [...progress.transactionIds, args.transactionId];

      // 2d. Check if user reached reward threshold from program.rules.visits
      const thresholdReached = newVisitCount >= program.rules.visits;

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      if (thresholdReached) {
        // 2e. User earned a reward!

        // Update existing progress to "completed" status
        await ctx.db.patch(progress._id, {
          currentVisits: newVisitCount,
          transactionIds: updatedTxIds,
          totalEarned: progress.totalEarned + 1,
          status: "completed",
          lastVisitDate: today,
        });

        // Get business details for notification
        const business = await ctx.db.get(args.businessId);

        // Schedule notification action: reward earned
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendRewardEarned,
          {
            userId: args.userId,
            businessId: args.businessId,
            rewardDescription: program.rules.reward,
            programName: program.name,
          }
        );

        // Create new active rewardProgress for next reward cycle (auto-renew)
        await ctx.db.insert("rewardProgress", {
          userId: args.userId,
          businessId: args.businessId,
          rewardProgramId: program._id,
          currentVisits: 0,
          totalEarned: 0,
          transactionIds: [],
          status: "active",
          createdAt: Date.now(),
        });

        console.log(
          `User ${args.userId} earned reward "${program.rules.reward}" ` +
            `at ${business?.name} (${newVisitCount} visits)`
        );
      } else {
        // 2f. Not yet at threshold, update progress
        await ctx.db.patch(progress._id, {
          currentVisits: newVisitCount,
          transactionIds: updatedTxIds,
          lastVisitDate: today,
        });

        console.log(
          `User ${args.userId} progress: ${newVisitCount}/${program.rules.visits} ` +
            `visits at program "${program.name}"`
        );
      }
    }

    return null;
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
import { v } from "convex/values";

export const processNewTransactions = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const BATCH_SIZE = 100;

    // 1. Query transactions with status="unmatched" using by_status index
    //    Process newest first (order desc), limit to batch size
    const unmatchedTxs = await ctx.runQuery(
      internal.matching.getUnmatchedTransactions,
      {
        limit: BATCH_SIZE,
      }
    );

    if (unmatchedTxs.length === 0) {
      console.log("No unmatched transactions to process");
      return null;
    }

    console.log(`Processing ${unmatchedTxs.length} unmatched transactions`);

    // 2. Process each unmatched transaction
    for (const tx of unmatchedTxs) {
      // 2a. Call matchTransaction internal mutation
      //     Returns businessId if confident match found, null otherwise
      const matchedBusinessId = await ctx.runMutation(
        internal.matching.matchTransaction,
        {
          transactionId: tx._id,
        }
      );

      // 2b. If businessId returned, update transaction and calculate rewards
      if (matchedBusinessId) {
        // Update transaction with matched businessId and status="matched"
        await ctx.runMutation(internal.matching.updateMatchedTransaction, {
          transactionId: tx._id,
          businessId: matchedBusinessId,
        });

        // Calculate and update reward progress for this match
        await ctx.runMutation(internal.matching.calculateRewards, {
          userId: tx.userId,
          businessId: matchedBusinessId,
          transactionId: tx._id,
        });
      }
      // If null returned, transaction remains status="unmatched" for next run
    }

    // 3. If processed full batch (100), there may be more unmatched transactions
    //    Schedule another run immediately to continue processing
    if (unmatchedTxs.length >= BATCH_SIZE) {
      console.log("Full batch processed, scheduling continuation");
      await ctx.scheduler.runAfter(
        0,
        internal.matching.processNewTransactions,
        {}
      );
    }

    return null;
  },
});

// Helper queries and mutations
export const getUnmatchedTransactions = internalQuery({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      _id: v.id("transactions"),
      userId: v.string(),
      merchantName: v.optional(v.string()),
      amount: v.number(),
      date: v.string(),
      category: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_status", (q) => q.eq("status", "unmatched"))
      .order("desc") // Newest first
      .take(args.limit);
  },
});

export const updateMatchedTransaction = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    businessId: v.id("businesses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      businessId: args.businessId,
      status: "matched",
    });
    return null;
  },
});
```

### Users & Roles

**`convex/users.ts`**:

```ts
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, getCurrentUser } from "./auth";

// Get current user with profile (Better Auth user + profiles table join)
export const getCurrentUserWithProfile = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      id: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      profile: v.union(
        v.null(),
        v.object({
          _id: v.id("profiles"),
          userId: v.string(),
          role: v.union(
            v.literal("consumer"),
            v.literal("business_owner"),
            v.literal("admin")
          ),
          phone: v.optional(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Admin-only: Set user role in profiles table
export const setUserRole = mutation({
  args: {
    userId: v.string(), // Better Auth user.id
    role: v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Require admin role to change other users' roles
    await requireRole(ctx, ["admin"]);

    // Find profile by userId using by_userId index
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      throw new Error(`Profile not found for userId: ${args.userId}`);
    }

    // Update role in profiles table
    await ctx.db.patch(profile._id, { role: args.role });

    console.log(`Updated user ${args.userId} to role: ${args.role}`);

    return null;
  },
});

// Helper: Require specific role(s) - throws error if not authorized
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"consumer" | "business_owner" | "admin">
) {
  // Get Better Auth user and join with profiles table
  const userWithProfile = await getCurrentUser(ctx);

  if (!userWithProfile) {
    throw new Error("Not authenticated");
  }

  if (!userWithProfile.profile) {
    throw new Error("Profile not found - user may need to complete onboarding");
  }

  const userRole = userWithProfile.profile.role;

  if (!allowedRoles.includes(userRole)) {
    throw new Error(
      `Forbidden: Requires role [${allowedRoles.join(" or ")}], ` +
        `but user has role [${userRole}]`
    );
  }

  return userWithProfile;
}
```

### Notifications

**`convex/notifications/subscribe.ts`** - Save push subscription:

```ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

export const subscribeToPush = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  returns: v.id("pushSubscriptions"),
  handler: async (ctx, args) => {
    // 1. Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // 2. Check if subscription already exists by endpoint
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    // 3. If exists, update keys (they may have changed)
    if (existing) {
      await ctx.db.patch(existing._id, {
        keys: args.keys,
      });
      return existing._id;
    }

    // 4. Create new subscription
    return await ctx.db.insert("pushSubscriptions", {
      userId: user.id,
      endpoint: args.endpoint,
      keys: args.keys,
      createdAt: Date.now(),
    });
  },
});
```

**`convex/notifications/sendRewardEarned.ts`** - Send reward notification:

```ts
"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const sendRewardEarned = internalAction({
  args: {
    userId: v.string(),
    businessId: v.id("businesses"),
    rewardDescription: v.string(),
    programName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get business details for notification
    const business = await ctx.runQuery(internal.businesses.getById, {
      businessId: args.businessId,
    });
    if (!business) throw new Error("Business not found");

    // 2. Create notification record in database
    const notificationId = await ctx.runMutation(
      internal.notifications.createRecord,
      {
        userId: args.userId,
        type: "reward_earned",
        title: `Reward Earned at ${business.name}!`,
        message: `You've earned: ${args.rewardDescription}`,
        data: {
          businessId: args.businessId,
          programName: args.programName,
        },
        status: "sent",
      }
    );

    // 3. Send push notification (if user has subscriptions)
    await ctx.runAction(internal.notifications.sendPushToUser, {
      userId: args.userId,
      title: `Reward Earned at ${business.name}!`,
      body: `You've earned: ${args.rewardDescription}`,
      data: { notificationId, businessId: args.businessId },
    });

    // 4. Send email notification using Resend component
    await ctx.runAction(internal.notifications.sendEmailToUser, {
      userId: args.userId,
      subject: `You earned a reward at ${business.name}!`,
      businessName: business.name,
      rewardDescription: args.rewardDescription,
    });

    return null;
  },
});
```

**`convex/notifications/sendPushToUser.ts`** - Send push to all user's devices:

```ts
"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:support@nopunchcards.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const sendPushToUser = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get all push subscriptions for this userId
    const subscriptions = await ctx.runQuery(
      internal.notifications.getUserSubscriptions,
      {
        userId: args.userId,
      }
    );

    // 2. Send push to each subscription
    for (const sub of subscriptions) {
      try {
        // 3. Format push notification payload
        const payload = JSON.stringify({
          title: args.title,
          body: args.body,
          icon: "/logo192.png",
          badge: "/logo192.png",
          data: args.data || {},
        });

        // 4. Send via Web Push API
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload
        );
      } catch (error: any) {
        // 5. If subscription expired (HTTP 410), delete it
        if (error.statusCode === 410) {
          await ctx.runMutation(internal.notifications.deleteSubscription, {
            subscriptionId: sub._id,
          });
        } else {
          console.error("Error sending push notification:", error);
        }
      }
    }

    return null;
  },
});
```

**`convex/notifications/markRead.ts`** - Mark notification as read:

```ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // 2. Get notification and verify ownership
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== user.id) {
      throw new Error(
        "Forbidden: Cannot mark other user's notifications as read"
      );
    }

    // 3. Update status to "read"
    await ctx.db.patch(args.notificationId, {
      status: "read",
    });

    return null;
  },
});
```

### Security Requirements

**Authentication & Authorization**:

```ts
// Every mutation/action must check auth
const user = await authComponent.getAuthUser(ctx);
if (!user) throw new Error("Not authenticated");

// Check ownership before mutations
const business = await ctx.db.get(args.businessId);
if (business.ownerId !== user.id) {
  throw new Error("Forbidden: You don't own this business");
}
```

**Idempotency**:

```ts
// Always check existing by plaidTransactionId before insert
const existing = await ctx.db
  .query("transactions")
  .withIndex("by_plaid_tx", (q) =>
    q.eq("plaidTransactionId", args.plaidTransactionId)
  )
  .unique();

if (existing) {
  // Update if needed, don't duplicate
  await ctx.db.patch(existing._id, updates);
} else {
  await ctx.db.insert("transactions", data);
}
```

**Encryption** (AES-256-GCM):

```ts
import { encrypt, decrypt } from "./plaid/encryption";

// Encrypt before storing
const ciphertext = encrypt(accessToken);
await ctx.db.insert("plaidAccounts", {
  plaidAccessTokenCiphertext: ciphertext,
  // ...
});

// Decrypt only in actions (never send to client)
const accessToken = decrypt(account.plaidAccessTokenCiphertext);
```

**Webhook Verification**:

```ts
// Plaid: Verify JWS signature before processing
const isValid = await verifyPlaidWebhook(bodyText, signature, keyId);
if (!isValid) return new Response("Invalid signature", { status: 401 });

// Resend: Component handles verification automatically
return await resendComponent.handleResendEventWebhook(ctx, req);
```

## App Routes & Acceptance Criteria

**📐 UI Reference**: See `loyalty-platform-design.md` for detailed screen layouts and user flows.

### Landing Page (`src/routes/index.tsx`)

- **Design**: Full-width hero, 3-step "How It Works", stats, footer
- **Layout**: Can use wide max-width (max-w-7xl), split layout on desktop
- **AC**: Displays both consumer and business CTAs; navigates to appropriate onboarding
- **See**: `loyalty-platform-design.md` → Landing Page section

### Business Routes (`src/routes/business/`)

**Common Layout**: All business routes use constrained 480px max-width.

**Bottom Navigation**: `[Dashboard] [Programs] [Analytics]`

- `register.tsx` (Multistep form)

  - **Design**: One field per screen, progress indicator, 4 steps
  - **AC**: Authenticated user can submit name/category/address → `businesses` row created `status=unverified`, `ownerId` set to user
  - **See**: `loyalty-platform-design.md` → Business Registration Flow

- `dashboard.tsx`

  - **Design**: Metric cards (3 in row), program list cards, recent redemptions
  - **AC**: Shows counts (total customers, total visits, active rewards) via Convex queries
  - **Header**: Business name + settings icon (no hamburger)
  - **Bottom Nav**: Active "Dashboard"
  - **See**: `loyalty-platform-design.md` → Business Dashboard section

- `programs/index.tsx` (renamed from rewards/)

  - **Design**: List of program cards with status badges
  - **AC**: Lists reward programs; shows status; can navigate to create/edit
  - **FAB**: Floating action button for "+ Create Program"
  - **Bottom Nav**: Active "Programs"
  - **Note**: Using "Programs" to match bottom nav design

- `programs/create.tsx` (Multistep form)

  - **Design**: 4-step form (Name → Visits → Reward → Review), progress dots
  - **AC**: Validates inputs; creates `rewardPrograms` with `rules.visits` and `rules.reward`
  - **Access**: Via FAB on programs/index
  - **See**: `loyalty-platform-design.md` → Multistep Form Example

- `programs/[id]/edit.tsx` (Optional)

  - **Design**: Same as create, pre-filled with existing data
  - **AC**: Updates existing program; validates inputs

- `analytics.tsx`

  - **Design**: Cards expand to show charts on tap
  - **AC**: Charts visits over time (basic), top customers
  - **Bottom Nav**: Active "Analytics"

- `settings.tsx`

  - **Design**: Settings list with sections
  - **Access**: Via settings icon in header (top right)
  - **AC**: Edit business profile, upload logo URL, view verification status

### Consumer Routes (`src/routes/consumer/`)

**Common Layout**: All consumer routes use constrained 480px max-width.

**Bottom Navigation**: `[Dashboard] [Merchants] [Rewards]`

- `onboarding.tsx` (Multistep form)

  - **Design**: Welcome screen → Plaid Link full-screen modal → Success
  - **Copy**: "Link the card you use most" (NOT "bank")
  - **AC**: Starts Plaid Link; on success, calls `exchangeToken`; redirects to dashboard
  - **See**: `loyalty-platform-design.md` → Consumer Onboarding Flow

- `dashboard.tsx`

  - **Design**: Greeting, progress cards (with rotation), recent activity list
  - **Header**: App name + profile icon + notification bell (no hamburger)
  - **AC**: Lists active `rewardProgress` (e.g., "3/5 visits") and recent matched transactions
  - **Cards**: Tappable → Opens bottom sheet (mobile) / modal (desktop)
  - **Bottom Nav**: Active "Dashboard"
  - **See**: `loyalty-platform-design.md` → Consumer Dashboard section

- `merchants.tsx`

  - **Design**: List/map toggle, category filters
  - **AC**: Shows participating businesses; filter by category; optional map later
  - **AC**: Nearby view returns businesses using geospatial `queryNearest` by current location
  - **Bottom Nav**: Active "Merchants"

- `rewards/index.tsx`

  - **Design**: Tabs for Active/Completed, reward cards
  - **AC**: Shows active and completed rewards
  - **Bottom Nav**: Active "Rewards"
  - **Cards**: Tappable → Navigate to claim page

- `rewards/[id]/claim.tsx` (NEW)

  - **Design**: Full-screen celebration → QR code modal
  - **Flow**: Notification → Celebration screen → QR code → Redemption success
  - **AC**: Shows QR code for business to scan; marks reward as redeemed
  - **See**: `loyalty-platform-design.md` → Flow 3: Reward Earned

- `notifications.tsx` (NEW)

  - **Design**: Full-screen list, grouped by date, unread indicator
  - **Access**: Via notification bell icon in header
  - **AC**: Lists all notifications; mark as read; delete notifications
  - **See**: `loyalty-platform-design.md` → Header Navigation

- `transactions.tsx`

  - **Design**: Timeline-style list, date grouping, filters
  - **Access**: Via profile menu OR "View all" link from dashboard's Recent Activity
  - **AC**: Lists matched transactions; filter by business/date; unmatch (sets `businessId=null`, `status=unmatched`)

- `settings.tsx`

  - **Design**: Settings list, linked cards section
  - **Access**: Via profile icon menu in header
  - **Copy**: "Linked Cards" section (NOT "Bank Accounts")
  - **AC**: Manage push notifications, linked accounts, disconnect Plaid

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

4. Design System

- [ ] Review `loyalty-platform-design.md` in full before implementing UI.
- [ ] Update `src/styles.css` with OKLCH color tokens from design doc.
- [ ] Create base layout wrapper with 480px max-width constraint.
- [ ] Create shared components: ProgressCard, BottomSheet/Modal, MultistepForm wrapper.
- [ ] Test responsive behavior: bottom sheets → modals on desktop.

5. Consumer UX

- [ ] Onboarding links Plaid with "Link your card" copy (not "bank").
- [ ] Dashboard shows progress with playful card rotation.
- [ ] Dashboard uses profile icon + bell (no hamburger menu).
- [ ] Bottom nav: Dashboard, Merchants, Rewards.
- [ ] Rewards claim page with QR code display.
- [ ] Notifications page accessible via bell icon.
- [ ] Transactions page accessible via profile menu.
- [ ] All screens constrained to 480px max-width.

6. Business UX

- [ ] Register flow uses multistep form (one field per screen).
- [ ] Dashboard with metric cards.
- [ ] Bottom nav: Dashboard, Programs, Analytics (NOT "Rewards").
- [ ] Programs list with FAB for creating new program.
- [ ] Create program uses 4-step form with progress indicators.
- [ ] Settings accessible via settings icon (no hamburger menu).

7. Notifications

- [ ] Push subscription storage; push and email notifications for reward earned.
- [ ] `@convex-dev/resend` installed & registered; test email mutation works.
- [ ] Resend webhook configured; `RESEND_WEBHOOK_SECRET` set; events recorded.
- [ ] `testMode` disabled in staging/prod after domain verification.

8. Geospatial

- [ ] `@convex-dev/geospatial` installed & registered; merchants nearby view returns results.

9. PWA

- [ ] Manifest, service worker, installable; auto-update enabled.

10. Roles & authz

- [ ] `setUserRole`, `getCurrentUserRole`, and route protection in place.

11. Billing (required)

- [ ] `AUTUMN_SECRET_KEY` set; component registered; checkout renders; plan limits enforced via server.

12. Readiness

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
- **Amounts**: Store as `v.number()` in **integer cents** (e.g., $5.00 = 500). Convert Plaid amounts: `Math.round(amount * 100)`. Display: `amount / 100`. This avoids floating point precision issues.
- **Currency**: Always store `currency: v.string()` with ISO code (e.g., "USD", "CAD").
- **Time**: Store `createdAt` as epoch ms (`Date.now()`); store transaction dates as ISO `YYYY-MM-DD` (Plaid format).
- **Idempotency**: Read-before-write on `plaidTransactionId`-indexed query to prevent duplicate transactions.
- **Data privacy**: Never send Plaid access tokens to client; always decrypt server-side only; restrict queries by `userId`.
- **Webhooks**: Always verify signatures (Plaid JWS, Resend HMAC) before processing.

---

## Changelog

### 2025-11-08T21:00:00Z

- **Aligned Routes with Design System**:
  - Renamed `business/rewards/` → `business/programs/` to match bottom nav terminology
  - Added missing routes: `consumer/rewards/[id]/claim.tsx` for QR code redemption
  - Added missing route: `consumer/notifications.tsx` for notification center
  - Added `business/programs/[id]/edit.tsx` for editing programs
  - Explicitly documented bottom navigation for each role:
    - Business: `[Dashboard] [Programs] [Analytics]`
    - Consumer: `[Dashboard] [Merchants] [Rewards]`
  - Clarified access patterns (profile menu, bell icon, FAB, etc.)
  - Updated checklist to reflect new route structure

### 2025-11-08T20:00:00Z

- **Integrated Design System Reference**:
  - Added "Design System & UI Requirements" section at top of playbook
  - Cross-referenced `loyalty-platform-design.md` throughout route specifications
  - Added design compliance checklist items (step 4)
  - Included quick-reference design patterns (mobile-first layout, cards, modals)
  - Updated all copy references: "Link your card" (not "bank")
  - Added navigation requirements: profile icon + bottom nav (no hamburger)

### 2025-11-08T18:00:00Z

- Added Better Auth Local Install with triggers (future-proof pattern)
- Clarified user ID architecture: component user.id → app tables
- Updated all schemas to use `userId: v.string()` for Better Auth user.id
- Added `.env.local` client environment variables section
- Expanded Plaid integration with detailed implementations:
  - Full encryption helpers (AES-256-GCM)
  - JWS webhook verification with Plaid public key
  - `/transactions/sync` endpoint usage (cursor-based)
  - Complete helper mutations for transactions
- Detailed matching engine with scoring algorithm (100-point scale)
- Complete reward calculation with threshold detection
- Batch processing for unmatched transactions (100 per run)
- Added specific TanStack Start route protection pattern
- Expanded Autumn billing with pricing-as-code config
- Complete PWA setup with Vite plugin configuration
- Added all notification implementations (push, email, subscribe, markRead)
- Clarified amount storage: integer cents in `v.number()`
- Added currency field to transactions
- Added syncCursor to plaidAccounts for pagination

Playbook last updated: 2025-11-08T21:00:00Z
