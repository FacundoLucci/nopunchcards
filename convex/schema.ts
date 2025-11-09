import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Better Auth manages 'user' table
  // We extend with profiles table (Better Auth user.id -> profiles.userId)
  profiles: defineTable({
    userId: v.string(), // Better Auth user.id
    role: v.union(
      v.literal("consumer"),
      v.literal("business_owner"),
      v.literal("admin")
    ),
    phone: v.optional(v.string()),
    preferences: v.optional(v.any()),
    // Onboarding tracking
    onboarding: v.optional(
      v.object({
        hasLinkedCard: v.boolean(),
        completedAt: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"]),

  businesses: defineTable({
    ownerId: v.string(), // Better Auth user.id
    name: v.string(),
    slug: v.string(), // Unique URL identifier for public page
    description: v.optional(v.string()),
    category: v.string(),
    address: v.optional(v.string()),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    logoUrl: v.optional(v.string()),
    status: v.union(v.literal("verified"), v.literal("unverified")),
    mccCodes: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_slug", ["slug"]),

  plaidAccounts: defineTable({
    userId: v.string(), // Better Auth user.id
    plaidItemId: v.string(),
    plaidAccessTokenCiphertext: v.string(), // AES-256-GCM encrypted
    accountIds: v.array(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("disconnected"),
      v.literal("error")
    ),
    institutionName: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    syncCursor: v.optional(v.string()), // For /transactions/sync pagination
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_plaidItemId", ["plaidItemId"]),

  transactions: defineTable({
    plaidTransactionId: v.string(),
    userId: v.string(), // Better Auth user.id
    plaidAccountId: v.id("plaidAccounts"),
    amount: v.number(), // Integer cents (e.g., $5.00 = 500)
    currency: v.string(), // ISO currency code (e.g., "USD")
    merchantName: v.optional(v.string()),
    date: v.string(), // ISO yyyy-mm-dd from Plaid
    category: v.optional(v.array(v.string())),
    businessId: v.optional(v.id("businesses")), // Matched business
    status: v.union(
      v.literal("pending"),
      v.literal("matched"),
      v.literal("unmatched")
    ),
    createdAt: v.number(),
  })
    .index("by_userId_and_date", ["userId", "date"])
    .index("by_businessId_and_date", ["businessId", "date"])
    .index("by_plaidTransactionId", ["plaidTransactionId"])
    .index("by_status", ["status"]),

  rewardPrograms: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.literal("visit"), // MVP only supports visit-based
    rules: v.object({ visits: v.number(), reward: v.string() }),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("archived")
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_businessId", ["businessId"])
    .index("by_status", ["status"]),

  rewardProgress: defineTable({
    userId: v.string(), // Better Auth user.id
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
    .index("by_userId", ["userId"])
    .index("by_businessId", ["businessId"])
    .index("by_rewardProgramId", ["rewardProgramId"]),

  notifications: defineTable({
    userId: v.string(), // Better Auth user.id
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    channel: v.union(v.literal("push"), v.literal("email")),
    status: v.union(
      v.literal("unread"),
      v.literal("read"),
      v.literal("sent")
    ),
    createdAt: v.number(),
  }).index("by_userId_and_status", ["userId", "status"]),

  pushSubscriptions: defineTable({
    userId: v.string(), // Better Auth user.id
    endpoint: v.string(),
    keys: v.object({ p256dh: v.string(), auth: v.string() }),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_endpoint", ["endpoint"]),
});

