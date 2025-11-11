import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { ProgressCard } from "@/components/ProgressCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-clients";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { Suspense } from "react";
import { CreditCard, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/consumer/dashboard")({
  // Client-side rendering for instant navigation
  ssr: false,
  component: ConsumerDashboard,
});

function ConsumerDashboard() {
  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 text-muted-foreground">Loading...</div>
      }
    >
      <OnboardingGuard>
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Greeting - shows immediately */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              Hey {firstName},
            </h2>
            <Suspense
              fallback={
                <p className="text-muted-foreground">
                  Loading your progress...
                </p>
              }
            >
              <GreetingMessage />
            </Suspense>
          </div>

          {/* Onboarding Progress - loads independently */}
          <Suspense fallback={null}>
            <OnboardingBanner />
          </Suspense>

          {/* Add Card CTA - loads independently */}
          <Suspense fallback={null}>
            <AddCardCTA />
          </Suspense>

          {/* Active Rewards - loads independently */}
          <Suspense
            fallback={
              <div className="text-muted-foreground">Loading rewards...</div>
            }
          >
            <ActiveRewardsSection />
          </Suspense>
        </div>
      </OnboardingGuard>
    </Suspense>
  );
}

// Each section loads its own data independently
function GreetingMessage() {
  const { data: activeProgress } = useSuspenseQuery(
    convexQuery(api.consumer.queries.getActiveProgress, {})
  );

  if (activeProgress && activeProgress.length > 0) {
    return (
      <p className="text-muted-foreground">
        You're {activeProgress[0].totalVisits - activeProgress[0].currentVisits}{" "}
        visits away from earning {activeProgress[0].rewardDescription}!
      </p>
    );
  }

  return (
    <p className="text-muted-foreground">
      Start shopping to earn your first reward
    </p>
  );
}

function OnboardingBanner() {
  const { data: onboardingStatus } = useSuspenseQuery(
    convexQuery(api.onboarding.queries.getOnboardingStatus, {})
  );

  if (onboardingStatus && !onboardingStatus.isComplete) {
    return (
      <OnboardingProgress
        hasLinkedCard={onboardingStatus.hasLinkedCard}
        isComplete={onboardingStatus.isComplete}
        compact
      />
    );
  }

  return null;
}

function AddCardCTA() {
  const router = useRouter();
  const { data: onboardingStatus } = useSuspenseQuery(
    convexQuery(api.onboarding.queries.getOnboardingStatus, {})
  );

  // Only show if onboarding is complete but user might want to add more cards
  if (!onboardingStatus?.isComplete) {
    return null;
  }

  const handleAddCard = () => {
    router.navigate({ to: "/consumer/settings" });
  };

  const handleTouchStart = () => {
    router.preloadRoute({ to: "/consumer/settings" } as any);
  };

  return (
    <div
      className="gradient-cta-card cursor-pointer"
      onClick={handleAddCard}
      onTouchStart={handleTouchStart}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <CreditCard className="size-6 text-white" />
          </div>
          <div className="absolute -top-1 -left-1 bg-white rounded-full p-0.5 shadow-md">
            <Plus className="size-3 text-emerald-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base mb-1">
            Add Another Card
          </h3>
          <p className="text-white/90 text-sm">
            Link more cards to earn rewards on all your purchases
          </p>
        </div>
      </div>
    </div>
  );
}

function ActiveRewardsSection() {
  const router = useRouter();
  const { data: activeProgress } = useSuspenseQuery(
    convexQuery(api.consumer.queries.getActiveProgress, {})
  );

  // Show top 3 rewards by most recent activity
  const topRewards = activeProgress.slice(0, 3);

  const handleTouchStart = () => {
    router.preloadRoute({ to: "/consumer/rewards" } as any);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Rewards</h3>
      {activeProgress.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No active rewards yet</p>
            <p className="text-sm mt-2">
              Shop at participating businesses to start earning
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {topRewards.map((progress) => (
            <ProgressCard
              key={progress._id}
              businessName={progress.businessName}
              currentVisits={progress.currentVisits}
              totalVisits={progress.totalVisits}
              rewardDescription={progress.rewardDescription}
            />
          ))}
          {activeProgress.length > 3 && (
            <Link to="/consumer/rewards" onTouchStart={handleTouchStart}>
              <Button variant="outline" className="w-full">
                View All ({activeProgress.length} rewards)
              </Button>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
