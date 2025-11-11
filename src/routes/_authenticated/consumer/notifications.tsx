import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { Suspense } from "react";
import { useMutation } from "convex/react";

export const Route = createFileRoute("/_authenticated/consumer/notifications")({
  ssr: false,
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <OnboardingGuard>
        <div className="p-6 space-y-4">
          <Suspense fallback={<div className="text-muted-foreground">Loading notifications...</div>}>
            <NotificationsList />
          </Suspense>
        </div>
      </OnboardingGuard>
    </Suspense>
  );
}

function NotificationsList() {
  const { data: notifications } = useSuspenseQuery(
    convexQuery(api.notifications.markRead.listForUser, {})
  );

  const markAsRead = useMutation(api.notifications.markRead.markAsRead);

  const handleNotificationClick = async (notificationId: any) => {
    await markAsRead({ notificationId });
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>No notifications yet</p>
        </CardContent>
      </Card>
    );
  }

  return notifications.map((notification) => (
    <Card
      key={notification._id}
      className={
        notification.status === "unread" ? "border-primary" : undefined
      }
      onClick={() => handleNotificationClick(notification._id)}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{notification.title}</h3>
            <p className="text-sm text-muted-foreground">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
          {notification.status === "unread" && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
          )}
        </div>
      </CardContent>
    </Card>
  ));
}
