"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { resendComponent } from "../sendEmails";
import { authComponent } from "../auth";

export const sendRewardEarned = internalAction({
  args: {
    userId: v.string(),
    businessId: v.id("businesses"),
    businessName: v.string(), // Pass name from caller to avoid extra query
    rewardDescription: v.string(),
    programName: v.string(),
    rewardClaimId: v.optional(v.id("rewardClaims")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Create notification record in database
    const notificationId = await ctx.runMutation(
      internal.notifications.helpers.createNotificationRecord,
      {
        userId: args.userId,
        type: "reward_earned",
        title: `Reward Earned at ${args.businessName}!`,
        message: `You've earned: ${args.rewardDescription}`,
        data: {
          businessId: args.businessId,
          programName: args.programName,
          rewardClaimId: args.rewardClaimId,
        },
        channel: "push",
        status: "sent",
      }
    );

    // 2. Send push notification (if user has subscriptions)
    await ctx.runAction(internal.notifications.sendPushToUser.sendPushToUser, {
      userId: args.userId,
      title: `Reward Earned at ${args.businessName}!`,
      body: `You've earned: ${args.rewardDescription}`,
      data: {
        notificationId,
        businessId: args.businessId,
        rewardClaimId: args.rewardClaimId,
      },
    });

    // 3. Send email notification using Resend component
    // Note: Email sending requires querying for user email from component
    // For simplicity in MVP, we'll skip email if we can't easily get it
    // In production, you'd want to store email in profiles table

    return null;
  },
});

