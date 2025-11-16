import { mutation, type MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { requireRole } from "../users";
import type { Doc, Id } from "../_generated/dataModel";

async function ensureBusinessOwnership(
  ctx: MutationCtx,
  businessId: Id<"businesses">,
  userId: string,
  isAdmin: boolean
) {
  const business = await ctx.db.get(businessId);
  if (!business) {
    throw new Error("Business not found");
  }

  if (business.ownerId !== userId && !isAdmin) {
    throw new Error("Forbidden: You don't own this business");
  }

  return business;
}

function normalizeRewardCode(code: string) {
  return code.trim().toUpperCase();
}

function mapClaimForResponse(claim: Doc<"rewardClaims">) {
  return {
    _id: claim._id,
    businessId: claim.businessId,
    programName: claim.programName,
    rewardDescription: claim.rewardDescription,
    status: claim.status,
    issuedAt: claim.issuedAt,
    redeemedAt: claim.redeemedAt,
  };
}

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    statementDescriptors: v.optional(v.array(v.string())),
  },
  returns: v.object({
    businessId: v.id("businesses"),
    slug: v.string(),
  }),
  handler: async (ctx, args) => {
    // Require business_owner role
    const user = await requireRole(ctx, ["business_owner", "admin"]);

    // Clean and normalize statement descriptors
    const cleanedDescriptors = args.statementDescriptors
      ?.map((d) => d.trim().toUpperCase())
      .filter((d) => d.length > 0);

    // Create business with unverified status
    const businessId = await ctx.db.insert("businesses", {
      ownerId: user.id,
      name: args.name,
      slug: "", // Will be generated
      category: args.category,
      description: args.description,
      address: args.address,
      logoUrl: args.logoUrl,
      statementDescriptors: cleanedDescriptors,
      status: "unverified",
      createdAt: Date.now(),
    });

    // Generate unique slug
    const slug: string = await ctx.runMutation(internal.businesses.generateSlug.generateSlug, {
      businessId,
      name: args.name,
    });

    return { businessId, slug };
  },
});

export const update = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    slug: v.optional(v.string()),
    statementDescriptors: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["business_owner", "admin"]);

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    // Check ownership (admins can edit any business)
    if (business.ownerId !== user.id && user.profile?.role !== "admin") {
      throw new Error("Forbidden: You don't own this business");
    }

    const { businessId, ...updates } = args;

    // Clean and normalize statement descriptors if provided
    if (updates.statementDescriptors) {
      updates.statementDescriptors = updates.statementDescriptors
        .map((d) => d.trim().toUpperCase())
        .filter((d) => d.length > 0);
    }

    // If slug is being updated, verify it's unique
    if (updates.slug && updates.slug !== business.slug) {
      const existing = await ctx.db
        .query("businesses")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .unique();

      if (existing && existing._id !== businessId) {
        throw new Error("Slug already taken");
      }
    }

    await ctx.db.patch(businessId, updates);

    return null;
  },
});

export const getByOwner = mutation({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("businesses"),
      _creationTime: v.number(), // System field
      name: v.string(),
      slug: v.string(),
      category: v.string(),
      status: v.string(),
      ownerId: v.string(),
      createdAt: v.number(),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      mccCodes: v.optional(v.array(v.string())),
      statementDescriptors: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx) => {
    const user = await requireRole(ctx, ["business_owner", "admin"]);

    return await ctx.db
      .query("businesses")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user.id))
      .collect();
  },
});

const claimResponseValidator = v.object({
  _id: v.id("rewardClaims"),
  businessId: v.id("businesses"),
  programName: v.string(),
  rewardDescription: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("redeemed"),
    v.literal("cancelled")
  ),
  issuedAt: v.number(),
  redeemedAt: v.optional(v.number()),
});

const claimMutationResult = v.object({
  outcome: v.union(
    v.literal("not_found"),
    v.literal("wrong_business"),
    v.literal("already_redeemed"),
    v.literal("success")
  ),
  claim: v.optional(claimResponseValidator),
});

export const previewRewardCode = mutation({
  args: {
    businessId: v.id("businesses"),
    rewardCode: v.string(),
  },
  returns: claimMutationResult,
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["business_owner", "admin"]);
    const isAdmin = user.profile?.role === "admin";
    await ensureBusinessOwnership(ctx, args.businessId, user.id, isAdmin);

    const normalizedCode = normalizeRewardCode(args.rewardCode);
    if (!normalizedCode) {
      return { outcome: "not_found" as const };
    }

    const claim = await ctx.db
      .query("rewardClaims")
      .withIndex("by_rewardCode", (q) => q.eq("rewardCode", normalizedCode))
      .unique();

    if (!claim) {
      return { outcome: "not_found" as const };
    }

    if (claim.businessId !== args.businessId) {
      return { outcome: "wrong_business" as const };
    }

    if (claim.status === "redeemed") {
      return {
        outcome: "already_redeemed" as const,
        claim: mapClaimForResponse(claim),
      };
    }

    if (claim.status === "cancelled") {
      return { outcome: "not_found" as const };
    }

    return {
      outcome: "success" as const,
      claim: mapClaimForResponse(claim),
    };
  },
});

export const confirmRewardRedemption = mutation({
  args: {
    businessId: v.id("businesses"),
    rewardCode: v.string(),
  },
  returns: claimMutationResult,
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["business_owner", "admin"]);
    const isAdmin = user.profile?.role === "admin";
    await ensureBusinessOwnership(ctx, args.businessId, user.id, isAdmin);

    const normalizedCode = normalizeRewardCode(args.rewardCode);
    if (!normalizedCode) {
      return { outcome: "not_found" as const };
    }

    const claim = await ctx.db
      .query("rewardClaims")
      .withIndex("by_rewardCode", (q) => q.eq("rewardCode", normalizedCode))
      .unique();

    if (!claim) {
      return { outcome: "not_found" as const };
    }

    if (claim.businessId !== args.businessId) {
      return { outcome: "wrong_business" as const };
    }

    if (claim.status === "redeemed") {
      return {
        outcome: "already_redeemed" as const,
        claim: mapClaimForResponse(claim),
      };
    }

    if (claim.status === "cancelled") {
      return { outcome: "not_found" as const };
    }

    const redeemedAt = Date.now();

    await ctx.db.patch(claim._id, {
      status: "redeemed",
      redeemedAt,
      redeemedByUserId: user.id,
    });

    try {
      await ctx.db.patch(claim.rewardProgressId, {
        status: "redeemed",
        redeemedAt,
      });
    } catch (error) {
      console.warn("Failed to patch rewardProgress for claim", claim._id, error);
    }

    return {
      outcome: "success" as const,
      claim: mapClaimForResponse({
        ...claim,
        status: "redeemed",
        redeemedAt,
      } as Doc<"rewardClaims">),
    };
  },
});

