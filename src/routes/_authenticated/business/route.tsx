import {
  createFileRoute,
  Outlet,
  redirect,
  useMatchRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { BusinessNav } from "@/components/business/BusinessNav";
import { UserMenu } from "@/components/UserMenu";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomFade } from "@/components/consumer/BottomFade";
import { BusinessRoutePrefetcher } from "@/components/business/RoutePrefetcher";
import { LogoIcon } from "@/components/LogoIcon";
import { RoleGuard } from "@/components/RoleGuard";

export const Route = createFileRoute("/_authenticated/business")({
  // Client-side only - no server round-trips during navigation
  component: BusinessLayout,
});

function BusinessLayout() {
  const matchRoute = useMatchRoute();
  const navigate = useNavigate();
  const router = useRouter();

  // Detect if we're on a main route (show header) or detail route (hide header)
  const isDashboard = !!matchRoute({ to: "/business/dashboard" });
  const isPrograms = !!matchRoute({ to: "/business/programs" });
  const isAnalytics = !!matchRoute({ to: "/business/analytics" });
  const isSettings = !!matchRoute({ to: "/business/settings" });
  const isProgramsCreate = !!matchRoute({ to: "/business/programs/create" });
  const isRegister = !!matchRoute({ to: "/business/register" });
  const isRedemptions = !!matchRoute({ to: "/business/redemptions" });

  const showHeader = isDashboard || isPrograms || isAnalytics || isSettings;
  const showNav = !isProgramsCreate && !isRegister && !isRedemptions; // Hide nav on programs/create, register, and redemptions

  // Get title based on route
  const getTitle = () => {
    if (isPrograms) return "Programs";
    if (isAnalytics) return "Analytics";
    if (isSettings) return "Settings";
    return "Business"; // Default for dashboard or other routes
  };

  // Preload on touchstart for instant navigation
  const handleTouchStart = () => {
    router.preloadRoute({ to: "/business/programs/create" } as any);
  };

  return (
    <RoleGuard
      allowedRoles={["business_owner", "admin"]}
      redirectTo="/consumer/home"
    >
      <div className={showNav ? "pb-28" : ""}>
        {/* Prefetch all business routes for instant navigation */}
        <BusinessRoutePrefetcher />

      {/* Conditional Header - shown only on main routes */}
      {showHeader && (
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm py-4 px-4 flex items-center justify-between z-10">
          <div className="flex flex-col gap-0.5">
            <LogoIcon
              showIcon={false}
              showWordmark
              size={20}
              wordmarkClassName="text-xl"
            />
            <div className="relative h-4">
              <AnimatePresence>
                <motion.p
                  key={getTitle()}
                  className="text-xs text-muted-foreground absolute top-0 left-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {getTitle()}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <UserMenu />
        </header>
      )}

      {/* Content Area - swapped via Outlet */}
      <Outlet />

      {/* Add Program Button - always mounted, visibility controlled by CSS */}
      <div
        className={`fixed bottom-24 left-0 right-0 flex justify-center z-40 transition-all ease-out duration-200 ${
          isPrograms
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-90 pointer-events-none"
        }`}
      >
        <button
          onClick={() => navigate({ to: "/business/programs/create" })}
          onTouchStart={handleTouchStart}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Program
        </button>
      </div>

      {/* Fade effect behind navigation */}
      {showNav && <BottomFade />}

      {/* Navigation - conditionally visible */}
      {showNav && <BusinessNav />}
      </div>
    </RoleGuard>
  );
}
