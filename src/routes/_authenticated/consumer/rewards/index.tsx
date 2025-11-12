import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { Suspense } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProgressCard } from "@/components/ProgressCard";

export const Route = createFileRoute("/_authenticated/consumer/rewards/")({
  ssr: false,
  component: RewardsPage,
});

function RewardsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-muted-foreground">Loading...</div>}
    >
      <OnboardingGuard>
        <RewardsContent />
      </OnboardingGuard>
    </Suspense>
  );
}

function RewardsContent() {
  const { data: activeProgress } = useSuspenseQuery(
    convexQuery(api.consumer.queries.getActiveProgress, {})
  );

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold mb-4">All Rewards</h2>
      {activeProgress.length === 0 ? (
        <div className="space-y-3">
          <div className="relative">
            {/* Example badge cutout */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 bg-muted border border-border px-3 py-0.5 rounded-full">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Example
              </span>
            </div>

            <div className="opacity-0">
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
        <div className="space-y-2">
          {activeProgress.map((progress) => (
            <Card
              key={progress._id}
              className="hover:bg-accent transition-colors"
            >
              <CardContent className="py-3 px-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {progress.businessName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {progress.rewardDescription}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {progress.programType === "visit" ? (
                        <p className="text-sm font-medium">
                          {progress.currentVisits}/{progress.totalVisits}
                        </p>
                      ) : (
                        <p className="text-sm font-medium">
                          ${(progress.currentSpendCents / 100).toFixed(2)}/${(progress.totalSpendCents / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Progress
                    value={
                      progress.programType === "visit"
                        ? (progress.currentVisits / progress.totalVisits) * 100
                        : (progress.currentSpendCents / progress.totalSpendCents) * 100
                    }
                    className="h-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
