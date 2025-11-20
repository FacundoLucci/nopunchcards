import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { requireRole } from "../users";

const brandColorsValidator = v.object({
  primary: v.string(),
  secondary: v.optional(v.string()),
  accent: v.optional(v.string()),
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    brandColors: v.optional(brandColorsValidator),
    brandSummary: v.optional(v.string()),
    googlePlaceId: v.optional(v.string()),
    googleRating: v.optional(v.number()),
    googleReviewCount: v.optional(v.number()),
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
      website: args.website,
      brandColors: args.brandColors,
      brandSummary: args.brandSummary,
      googlePlaceId: args.googlePlaceId,
      googleRating: args.googleRating,
      googleReviewCount: args.googleReviewCount,
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
    website: v.optional(v.string()),
    brandColors: v.optional(brandColorsValidator),
    brandSummary: v.optional(v.string()),
    googlePlaceId: v.optional(v.string()),
    googleRating: v.optional(v.number()),
    googleReviewCount: v.optional(v.number()),
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

