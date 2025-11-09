import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const userId = user.userId || user._id;

    // 2. Get notification and verify ownership
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("Forbidden: Cannot mark other user's notifications as read");
    }

    // 3. Update status to "read"
    await ctx.db.patch(args.notificationId, {
      status: "read",
    });

    return null;
  },
});

export const listForUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      data: v.optional(v.any()),
      status: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const userId = user.userId || user._id;

    return await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_status", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);
  },
});

