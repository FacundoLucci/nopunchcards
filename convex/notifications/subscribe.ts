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

    const userId = user.userId || user._id;

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
      userId,
      endpoint: args.endpoint,
      keys: args.keys,
      createdAt: Date.now(),
    });
  },
});

