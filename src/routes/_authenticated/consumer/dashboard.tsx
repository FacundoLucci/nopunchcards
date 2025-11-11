import { createFileRoute, Link } from "@tanstack/react-router";
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

function ActiveRewardsSection() {
  const { data: activeProgress } = useSuspenseQuery(
    convexQuery(api.consumer.queries.getActiveProgress, {})
  );

  // Show top 3 rewards by most recent activity
  const topRewards = activeProgress.slice(0, 3);

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
            <Link to="/consumer/rewards">
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
