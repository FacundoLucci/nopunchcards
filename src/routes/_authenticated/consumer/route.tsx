import {
  createFileRoute,
  Outlet,
  useMatchRoute,
  Link,
} from "@tanstack/react-router";
import { BottomNav } from "@/components/consumer/BottomNav";
import { BottomFade } from "@/components/consumer/BottomFade";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/consumer")({
  component: ConsumerLayout,
});

function ConsumerLayout() {
  const matchRoute = useMatchRoute();

  // Detect if we're on a main route (show header) or detail route (hide header)
  const isDashboard = !!matchRoute({ to: "/consumer/dashboard" });
  const isMerchants = !!matchRoute({ to: "/consumer/merchants" });
  const showHeader = isDashboard || isMerchants;

  const isNotifications = !!matchRoute({ to: "/consumer/notifications" });

  // Get page title based on route
  const getPageTitle = () => {
    if (isDashboard) return "Dashboard";
    if (isMerchants) return "Merchants";
    return "";
  };

  return (
    <div className="pb-28">
      {/* Conditional Header - shown only on main routes */}
      {showHeader && (
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm py-4 px-4 flex items-center justify-between z-10">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold">NO PUNCH CARDS</h1>
            <div className="relative h-4">
              <AnimatePresence>
                <motion.p
                  key={getPageTitle()}
                  className="text-xs text-muted-foreground absolute top-0 left-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {getPageTitle()}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/consumer/notifications">
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
      <BottomFade />

      {/* Navigation - always visible */}
      <BottomNav />
    </div>
  );
}
