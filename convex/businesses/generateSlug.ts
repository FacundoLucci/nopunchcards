import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Helper function to generate unique slug from business name
// Used internally by business mutations
export async function generateUniqueSlug(
  ctx: MutationCtx,
  businessId: Id<"businesses">,
  name: string
): Promise<string> {
  // 1. Create base slug from name
  //    "Joe's Coffee Shop" → "joes-coffee-shop"
  let baseSlug = name
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
  if (existing && existing._id !== businessId) {
    const suffix = Math.random().toString(36).substring(2, 6);
    baseSlug = `${baseSlug}-${suffix}`;
  }

  // 4. Update business with slug
  await ctx.db.patch(businessId, { slug: baseSlug });

  return baseSlug;
}

