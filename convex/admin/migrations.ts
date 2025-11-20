import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

type MigrationResult = {
  success: boolean;
  migratedCount: number;
  errors: string[];
};

/**
 * Run this action once to migrate old plaidAccounts to the new schema.
 * This will fetch account details from Plaid and update all records.
 *
 * Usage from the Convex dashboard:
 * Run: admin.migrations:migratePlaidAccounts
 */
export const migratePlaidAccounts = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx): Promise<MigrationResult> => {
    console.log("Starting Plaid accounts migration...");

    const result = await ctx.runAction(
      // @ts-ignore - Type instantiation depth workaround for complex action reference
      internal.plaid.migrateAccounts.migrateOldAccounts,
      {}
    );

    console.log("Migration complete:", result);
    return result;
  },
});
