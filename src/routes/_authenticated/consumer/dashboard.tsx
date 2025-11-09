import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ProgressCard } from "@/components/ProgressCard";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-clients";
import { ConsumerLayout } from "@/components/consumer/ConsumerLayout";

export const Route = createFileRoute("/_authenticated/consumer/dashboard")({
  component: ConsumerDashboard,
});

function ConsumerDashboard() {
  const { data: session } = authClient.useSession();
  const activeProgress = useQuery(api.consumer.queries.getActiveProgress, {});
  const recentTransactions = useQuery(api.consumer.queries.getRecentTransactions, {
    limit: 5,
  });

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <ConsumerLayout>
      <div className="p-6 space-y-8">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Hey {firstName},</h2>
          {activeProgress && activeProgress.length > 0 ? (
            <p className="text-muted-foreground">
              You're{" "}
              {activeProgress[0].totalVisits - activeProgress[0].currentVisits} visits
              away from earning {activeProgress[0].rewardDescription}!
            </p>
          ) : (
            <p className="text-muted-foreground">
              Start shopping to earn your first reward
            </p>
          )}
        </div>

        {/* Active Rewards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Rewards</h3>
          {activeProgress === undefined ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : activeProgress.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No active rewards yet</p>
                <p className="text-sm mt-2">
                  Shop at participating businesses to start earning
                </p>
              </CardContent>
            </Card>
          ) : (
            activeProgress.map((progress) => (
              <ProgressCard
                key={progress._id}
                businessName={progress.businessName}
                currentVisits={progress.currentVisits}
                totalVisits={progress.totalVisits}
                rewardDescription={progress.rewardDescription}
              />
            ))
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          {recentTransactions === undefined ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : recentTransactions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <Card key={tx._id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {tx.businessName || tx.merchantName || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(Math.abs(tx.amount) / 100).toFixed(2)}
                        </p>
                        {tx.currentVisits !== undefined && tx.totalVisits && (
                          <p className="text-xs text-muted-foreground">
                            {tx.currentVisits}/{tx.totalVisits} visits
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ConsumerLayout>
  );
}

