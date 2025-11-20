import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { ProgressCard } from "@/components/ProgressCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-clients";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { Suspense } from "react";
import { ArrowRight, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/consumer/home")({
  // Client-side rendering for instant navigation
  ssr: false,
  component: ConsumerHome,
});

function ConsumerHome() {
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

          {/* Redeemable Rewards Section - loads independently */}
          <Suspense fallback={null}>
            <RedeemableRewardsSection />
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
    const first = activeProgress[0];
    if (first.programType === "visit") {
      return (
        <p className="text-muted-foreground">
          You're {first.totalVisits - first.currentVisits} visits away from
          earning {first.rewardDescription}!
        </p>
      );
    } else {
      const remaining = (first.totalSpendCents - first.currentSpendCents) / 100;
      return (
        <p className="text-muted-foreground">
          You're ${remaining.toFixed(2)} away from earning{" "}
          {first.rewardDescription}!
        </p>
      );
    }
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

function RedeemableRewardsSection() {
  const { data: pendingClaims } = useSuspenseQuery(
    convexQuery(api.consumer.queries.getPendingRewardClaims, {})
  );

  if (pendingClaims.length === 0) {
    return null;
  }

  // Show top 3 rewards
  const displayRewards = pendingClaims.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header with View All button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-semibold">Redeemable Rewards</h3>
        </div>
        <Link to="/consumer/rewards">
          <Button variant="ghost" size="sm" className="gap-2">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Rewards List */}
      <div className="space-y-3">
        {displayRewards.map((claim) => (
          <Link
            key={claim._id}
            to="/consumer/rewards/$claimId/claim"
            params={{ claimId: claim._id }}
          >
            <Card className="border-2 border-amber-500/50 dark:border-amber-400/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-950/50 dark:hover:to-yellow-950/50 transition-all cursor-pointer shadow-md hover:shadow-lg py-3">
              <CardContent className="px-4 py-0 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-500 dark:to-yellow-600 flex items-center justify-center shadow-md">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-amber-950 dark:text-amber-100">
                    {claim.businessName}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 truncate">
                    {claim.rewardDescription}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Earned{" "}
                    {formatDistanceToNow(new Date(claim.issuedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white border-0 shadow-md"
                >
                  Redeem
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
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
      {activeProgress.length === 0 ? (
        <div className="space-y-3">
          <div className="relative">
            {/* Example badge cutout */}
            <div className="absolute -top-3 -right-2 z-10 bg-yellow-50 border border-yellow-200 px-3 pt-0 py-0.5 rounded-full">
              <span className="text-xs font-semibold text-yellow-900 uppercase tracking-wide">
                Example
              </span>
            </div>

            <div className="opacity-90">
              <ProgressCard
                businessName="The Coffee Shop"
                programType="visit"
                currentVisits={3}
                totalVisits={10}
                rewardDescription="Free medium coffee"
              />
            </div>
          </div>

          <Link to="/consumer/find-rewards">
            <Button variant="ghost" className="w-full group">
              Find participating businesses
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {topRewards.map((progress) => {
            if (progress.programType === "visit") {
              return (
                <ProgressCard
                  key={progress._id}
                  businessName={progress.businessName}
                  programType="visit"
                  currentVisits={progress.currentVisits}
                  totalVisits={progress.totalVisits}
                  minimumSpendCents={progress.minimumSpendCents}
                  rewardDescription={progress.rewardDescription}
                />
              );
            } else {
              return (
                <ProgressCard
                  key={progress._id}
                  businessName={progress.businessName}
                  programType="spend"
                  currentSpendCents={progress.currentSpendCents}
                  totalSpendCents={progress.totalSpendCents}
                  rewardDescription={progress.rewardDescription}
                />
              );
            }
          })}
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
