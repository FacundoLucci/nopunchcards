import {
  createFileRoute,
  Outlet,
  useMatchRoute,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { BottomNav } from "@/components/consumer/BottomNav";
import { BottomFade } from "@/components/consumer/BottomFade";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { ConsumerRoutePrefetcher } from "@/components/consumer/RoutePrefetcher";

export const Route = createFileRoute("/_authenticated/consumer")({
  component: ConsumerLayout,
});

function ConsumerLayout() {
  const matchRoute = useMatchRoute();
  const router = useRouter();

  // Detect if we're on a main route (show header) or detail route (hide header)
  const isDashboard = !!matchRoute({ to: "/consumer/dashboard" });
  const isMerchants = !!matchRoute({ to: "/consumer/merchants" });
  const isCards = !!matchRoute({ to: "/consumer/cards" });
  const isOnboarding = !!matchRoute({ to: "/consumer/onboarding" });
  const showHeader = isDashboard || isMerchants || isCards;

  const isNotifications = !!matchRoute({ to: "/consumer/notifications" });

  // Hide nav and header on onboarding
  const showNav = !isOnboarding;

  // Preload on touchstart for instant navigation
  const handleTouchStart = (to: string) => {
    router.preloadRoute({ to } as any);
  };

  return (
    <div className={showNav ? "pb-28" : ""}>
      {/* Prefetch all consumer routes for instant navigation */}
      {showNav && <ConsumerRoutePrefetcher />}

      {/* Conditional Header - shown only on main routes */}
      {showHeader && showNav && (
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm py-4 px-4 flex items-center justify-between z-10">
          <h1 className="text-lg font-black text-white bg-[#F03D0C] rounded-md px-1.5 py-0">
            NO PUNCH CARDS
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link
                to="/consumer/notifications"
                onTouchStart={() => handleTouchStart("/consumer/notifications")}
              >
                <Bell
                  className="w-5 h-5"
                  fill={isNotifications ? "currentColor" : "none"}
                />
              </Link>
            </Button>
            <UserMenu />
          </div>
        </header>
      )}

      {/* Content Area - swapped via Outlet */}
      <Outlet />

      {/* Fade effect behind navigation */}
      {showNav && <BottomFade />}

      {/* Navigation - conditionally visible */}
      {showNav && <BottomNav />}
    </div>
  );
}
