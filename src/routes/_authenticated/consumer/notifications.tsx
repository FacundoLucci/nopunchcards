import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ConsumerLayout } from "@/components/consumer/ConsumerLayout";
import { requireOnboarding } from "@/lib/onboarding-check";

export const Route = createFileRoute("/_authenticated/consumer/notifications")({
  ssr: true,
  beforeLoad: async ({ location }) => {
    await requireOnboarding(location.pathname);
  },
  component: NotificationsPage,
});

function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.markRead.listForUser, {});
  const markAsRead = useMutation(api.notifications.markRead.markAsRead);

  const handleNotificationClick = async (notificationId: any) => {
    await markAsRead({ notificationId });
  };

  return (
    <ConsumerLayout>
      <div className="p-6 space-y-4">
        {notifications === undefined ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
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
          ))
        )}
      </div>
    </ConsumerLayout>
  );
}

