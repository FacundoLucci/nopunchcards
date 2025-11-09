import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Generate unique slug from business name
export const generateSlug = internalMutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // 1. Create base slug from name
    //    "Joe's Coffee Shop" → "joes-coffee-shop"
    let baseSlug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Collapse multiple hyphens

    // 2. Check if slug exists
    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", baseSlug))
      .unique();

    // 3. If exists and it's not the current business, append random suffix
    if (existing && existing._id !== args.businessId) {
      const suffix = Math.random().toString(36).substring(2, 6);
      baseSlug = `${baseSlug}-${suffix}`;
    }

    // 4. Update business with slug
    await ctx.db.patch(args.businessId, { slug: baseSlug });

    return baseSlug;
  },
});

