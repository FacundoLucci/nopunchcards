import { Link, useMatchRoute, useRouter } from "@tanstack/react-router";
import { Home, Search, ArrowLeft, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback } from "react";

export function BottomNav() {
  const matchRoute = useMatchRoute();
  const router = useRouter();

  const isHome = !!matchRoute({ to: "/consumer/home" });
  const isFindRewards = !!matchRoute({ to: "/consumer/find-rewards" });
  const isCards = !!matchRoute({ to: "/consumer/cards" });
  const isNotifications = !!matchRoute({ to: "/consumer/notifications" });
  const isSettings = !!matchRoute({ to: "/consumer/settings" });
  const isRewards = !!matchRoute({ to: "/consumer/rewards" });
  const isOnboarding = !!matchRoute({ to: "/consumer/onboarding" });

  // Check if we're on a detail/secondary page
  const isDetailPage =
    isNotifications || isSettings || isRewards || isOnboarding;

  // Preload route on touchstart (before tap completes) for instant navigation
  const handleTouchStart = useCallback(
    (to: string) => {
      router.preloadRoute({ to } as any);
    },
    [router]
  );

  if (isDetailPage) {
    // Show back button for detail pages - goes to dashboard
    return (
      <nav className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[480px] mx-auto px-6 flex justify-center">
          <Link
            to="/consumer/home"
            onTouchStart={() => handleTouchStart("/consumer/home")}
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
        <div className="pointer-events-auto bg-background/80 backdrop-blur-lg border shadow-lg rounded-full px-2 py-2 flex items-center gap-4">
          <Link
            to="/consumer/home"
            onTouchStart={() => handleTouchStart("/consumer/home")}
            className="flex items-center justify-center transition-all p-2 rounded-full hover:bg-accent/50 min-w-[40px] min-h-[40px] relative z-10"
          >
            {isHome && (
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
              fill={isHome ? "currentColor" : "none"}
              strokeWidth={isHome ? 2 : 1.5}
            />
          </Link>
          <Link
            to="/consumer/cards"
            onTouchStart={() => handleTouchStart("/consumer/cards")}
            className="flex items-center justify-center transition-all p-2 rounded-full hover:bg-accent/50 min-w-[40px] min-h-[40px] relative z-10"
          >
            {isCards && (
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
            <Wallet
              className="w-6 h-6 transition-all relative z-10"
              strokeWidth={isCards ? 2 : 1.5}
            />
          </Link>
          <Link
            to="/consumer/find-rewards"
            onTouchStart={() => handleTouchStart("/consumer/find-rewards")}
            className="flex items-center justify-center transition-all p-2 rounded-full hover:bg-accent/50 min-w-[40px] min-h-[40px] relative z-10"
          >
            {isFindRewards && (
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
              strokeWidth={isFindRewards ? 2 : 1.5}
            />
          </Link>
        </div>
      </div>
    </nav>
  );
}
