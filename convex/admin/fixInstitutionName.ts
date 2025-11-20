import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-time fix to update institution name from "ins_10" to proper name.
 * Run this from the dashboard with your plaidAccountId.
 */
export const updateInstitutionName = mutation({
  args: {
    plaidAccountId: v.id("plaidAccounts"),
    institutionName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.plaidAccountId, {
      institutionName: args.institutionName,
      institutionId: "ins_10", // Keep the ID for reference
    });
    console.log(`Updated institution name to: ${args.institutionName}`);
    return null;
  },
});

