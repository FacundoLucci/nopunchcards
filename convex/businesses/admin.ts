import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Admin mutation to manually verify a business
 * This bypasses normal authentication and ownership checks
 */
export const verifyBusiness = internalMutation({
  args: {
    businessId: v.id("businesses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    
    if (!business) {
      throw new Error(`Business not found: ${args.businessId}`);
    }

    // Update status to verified
    await ctx.db.patch(args.businessId, {
      status: "verified",
    });

    console.log(`✅ Verified business: ${business.name} (${args.businessId})`);
    
    return null;
  },
});

/**
 * Admin mutation to manually unverify a business
 */
export const unverifyBusiness = internalMutation({
  args: {
    businessId: v.id("businesses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    
    if (!business) {
      throw new Error(`Business not found: ${args.businessId}`);
    }

    // Update status to unverified
    await ctx.db.patch(args.businessId, {
      status: "unverified",
    });

    console.log(`❌ Unverified business: ${business.name} (${args.businessId})`);
    
    return null;
  },
});

