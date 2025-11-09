"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:support@nopunchcards.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const sendPushToUser = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get all push subscriptions for this userId
    const subscriptions = await ctx.runQuery(
      internal.notifications.helpers.getUserSubscriptions,
      {
        userId: args.userId,
      }
    );

    // 2. Send push to each subscription
    for (const sub of subscriptions) {
      try {
        // 3. Format push notification payload
        const payload = JSON.stringify({
          title: args.title,
          body: args.body,
          icon: "/logo192.png",
          badge: "/logo192.png",
          data: args.data || {},
        });

        // 4. Send via Web Push API
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload
        );
      } catch (error: any) {
        // 5. If subscription expired (HTTP 410), delete it
        if (error.statusCode === 410) {
          await ctx.runMutation(internal.notifications.helpers.deleteSubscription, {
            subscriptionId: sub._id,
          });
        } else {
          console.error("Error sending push notification:", error);
        }
      }
    }

    return null;
  },
});

