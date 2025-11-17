import {
  createFileRoute,
  Outlet,
  redirect,
  useMatchRoute,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { BottomNav } from "@/components/consumer/BottomNav";
import { BottomFade } from "@/components/consumer/BottomFade";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Bell, CreditCard } from "lucide-react";
import { ConsumerRoutePrefetcher } from "@/components/consumer/RoutePrefetcher";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { LogoIcon } from "@/components/LogoIcon";

export const Route = createFileRoute("/_authenticated/consumer")({
  // Client-side only - no server round-trips during navigation
  component: ConsumerLayout,
});

function ConsumerLayout() {
  const matchRoute = useMatchRoute();
  const router = useRouter();
  const { blocked } = Route.useSearch() as { blocked?: string };

  // Show toast if user was blocked from accessing a route
  if (blocked === "business") {
    toast.error("You don't have permission to access business features");
    // Clear the search param
    router.navigate({ to: "/consumer/home", replace: true });
  }

  // Detect if we're on a main route (show header) or detail route (hide header)
  const isHome = !!matchRoute({ to: "/consumer/home" });
  const isFindRewards = !!matchRoute({ to: "/consumer/find-rewards" });
  const isCards = !!matchRoute({ to: "/consumer/cards" });
  const isOnboarding = !!matchRoute({ to: "/consumer/onboarding" });
  const showHeader = isHome || isFindRewards || isCards;

  const isNotifications = !!matchRoute({ to: "/consumer/notifications" });

  // Hide nav and header on onboarding
  const showNav = !isOnboarding;

  // Plaid link functionality for Add Card button
  const createLinkToken = useAction(api.plaid.linkToken.createLinkToken);
  const exchangeToken = useAction(api.plaid.exchangeToken.exchangePublicToken);
  const [linking, setLinking] = useState(false);

  const handleAddCard = async () => {
    if (linking) return;

    setLinking(true);
    try {
      const { linkToken } = await createLinkToken({});

      // Initialize Plaid Link
      // @ts-ignore - Plaid Link will be loaded via script tag
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken: string) => {
          try {
            await exchangeToken({ publicToken });
            toast.success("Card linked successfully!");
          } catch (error) {
            toast.error("Failed to link card");
          }
        },
        onExit: () => {
          setLinking(false);
        },
      });

      handler.open();
    } catch (error) {
      toast.error("Failed to start Plaid Link");
      setLinking(false);
    }
  };

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
          <LogoIcon
            showIcon={false}
            showWordmark
            size={20}
            wordmarkClassName="text-xl"
            iconClassName="shadow-sm"
          />
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

      {/* Add Card Button - always mounted, visibility controlled by CSS */}
      <div
        className={`fixed bottom-24 left-0 right-0 flex justify-center z-40 transition-all ease-out duration-200 ${
          isCards
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-90 pointer-events-none"
        }`}
      >
        <button
          onClick={handleAddCard}
          disabled={linking}
          className="bg-primary font-semibold text-primary-foreground px-6 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CreditCard className="size-5 text-white/90" />
          {linking ? "Opening Plaid..." : "Add a card"}
        </button>
      </div>

      {/* Fade effect behind navigation */}
      {showNav && <BottomFade />}

      {/* Navigation - conditionally visible */}
      {showNav && <BottomNav />}
    </div>
  );
}
