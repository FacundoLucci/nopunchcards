import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { Suspense } from "react";
import { Progress } from "@/components/ui/progress";

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
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No active rewards yet</p>
              <p className="text-sm mt-2">
                Shop at participating businesses to start earning
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeProgress.map((progress) => (
              <Card key={progress._id} className="hover:bg-accent transition-colors">
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
                        <p className="text-sm font-medium">
                          {progress.currentVisits}/{progress.totalVisits}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={(progress.currentVisits / progress.totalVisits) * 100} 
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
