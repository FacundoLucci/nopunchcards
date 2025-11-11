import { Link, useMatchRoute } from "@tanstack/react-router";
import { Home, Search, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function BottomNav() {
  const matchRoute = useMatchRoute();

  const isDashboard = !!matchRoute({ to: "/consumer/dashboard" });
  const isMerchants = !!matchRoute({ to: "/consumer/merchants" });
  const isNotifications = !!matchRoute({ to: "/consumer/notifications" });
  const isSettings = !!matchRoute({ to: "/consumer/settings" });
  const isRewards = !!matchRoute({ to: "/consumer/rewards" });
  const isOnboarding = !!matchRoute({ to: "/consumer/onboarding" });

  // Check if we're on a detail/secondary page
  const isDetailPage =
    isNotifications || isSettings || isRewards || isOnboarding;

  if (isDetailPage) {
    // Show back button for detail pages - goes to dashboard
    return (
      <nav className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[480px] mx-auto px-6 flex justify-center">
          <Link
            to="/consumer/dashboard"
            className="pointer-events-auto bg-background/80 backdrop-blur-lg border shadow-lg rounded-full p-3 flex items-center justify-center transition-all hover:bg-accent/50 min-w-[48px] min-h-[48px]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>
      </nav>
    );
  }

  // Show main navigation for primary pages
  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-[480px] mx-auto px-6 flex justify-center">
        <div className="pointer-events-auto bg-background/80 backdrop-blur-lg border shadow-lg rounded-full px-3 py-2 flex items-center gap-4">
          <Link
            to="/consumer/dashboard"
            className="flex items-center justify-center transition-all p-2 rounded-full hover:bg-accent/50 min-w-[40px] min-h-[40px] relative z-10"
          >
            {isDashboard && (
              <motion.div
                layoutId="nav-highlight"
                className="absolute inset-0 bg-primary/10 rounded-full"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            <Home
              className="w-6 h-6 transition-all relative z-10"
              fill={isDashboard ? "currentColor" : "none"}
              strokeWidth={isDashboard ? 2 : 1.5}
            />
          </Link>
          <Link
            to="/consumer/merchants"
            className="flex items-center justify-center transition-all p-2 rounded-full hover:bg-accent/50 min-w-[40px] min-h-[40px] relative z-10"
          >
            {isMerchants && (
              <motion.div
                layoutId="nav-highlight"
                className="absolute inset-0 bg-primary/10 rounded-full"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            <Search
              className="w-6 h-6 transition-all relative z-10"
              strokeWidth={isMerchants ? 2 : 1.5}
            />
          </Link>
        </div>
      </div>
    </nav>
  );
}
