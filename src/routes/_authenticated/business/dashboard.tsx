import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareYourPageCard } from "@/components/ShareYourPageCard";
import { Plus, BarChart3, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-clients";
import type { Id } from "../../../../convex/_generated/dataModel";
import { RewardRedemptionDialog } from "@/components/business/RewardRedemptionDialog";

export const Route = createFileRoute("/_authenticated/business/dashboard")({
  ssr: true,
  beforeLoad: ({ context, location }) => {
    if (!context.userId) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: BusinessDashboard,
});

function BusinessDashboard() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  useEffect(() => {
    if (!sessionPending && !session) {
      navigate({
        to: "/login",
        search: { redirect: "/business/dashboard" },
      });
    }
  }, [sessionPending, session, navigate]);

  if (sessionPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const navigate = useNavigate();

  const { data: businesses } = useSuspenseQuery(
    convexQuery(api.businesses.queries.getMyBusinesses, {})
  );

  // Auto-redirect to registration if no businesses
  useEffect(() => {
    if (businesses.length === 0) {
      navigate({ to: "/business/register" });
    }
  }, [businesses.length, navigate]);

  // Show loading while redirecting
  if (businesses.length === 0) {
    return null;
  }

  const business = businesses[0];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Stats */}
      <Suspense
        fallback={<div className="text-muted-foreground">Loading stats...</div>}
      >
        <StatsSection businessId={business._id} navigate={navigate} />
      </Suspense>

      {/* Redemption */}
      <RedeemRewardCard businessId={business._id} />

      {/* Share Page Card */}
      <ShareYourPageCard slug={business.slug} />

      {/* Active Programs */}
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading programs...</div>
        }
      >
        <ProgramsSection businessId={business._id} />
      </Suspense>
    </div>
  );
}

function StatsSection({
  businessId,
  navigate,
}: {
  businessId: Id<"businesses">;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { data: stats } = useSuspenseQuery(
    convexQuery(api.businesses.queries.getDashboardStats, { businessId })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-around py-3 sm:py-4">
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold">
            {stats?.totalVisits || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Visits</p>
        </div>

        <div className="h-10 sm:h-12 w-px bg-border" />

        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold">
            {stats?.totalRewards || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Rewards</p>
        </div>

        <div className="h-10 sm:h-12 w-px bg-border" />

        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold">
            {stats?.averageVisits || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Avg</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        size="sm"
        onClick={() => navigate({ to: "/business/analytics" })}
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        View All Analytics
      </Button>
    </div>
  );
}

function RedeemRewardCard({ businessId }: { businessId: Id<"businesses"> }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Redeem a Reward</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Help customers redeem their earned rewards
          </p>
          <Button
            className="w-full h-14"
            onClick={() => setIsDialogOpen(true)}
            size="lg"
          >
            <Gift className="w-5 h-5 mr-2" />
            Start Redemption
          </Button>
        </CardContent>
      </Card>

      <RewardRedemptionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        businessId={businessId}
      />
    </>
  );
}

function ProgramsSection({ businessId }: { businessId: Id<"businesses"> }) {
  const navigate = useNavigate();
  const { data: programs } = useSuspenseQuery(
    convexQuery(api.rewardPrograms.mutations.listByBusiness, { businessId })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-semibold">Active Programs</h2>
        <Button
          size="sm"
          onClick={() => navigate({ to: "/business/programs/create" })}
        >
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden xs:inline">Create</span>
          <span className="xs:hidden">New</span>
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No programs yet</p>
            <p className="text-sm mt-2">Create your first reward program</p>
          </CardContent>
        </Card>
      ) : (
        programs.map((program) => (
          <Card key={program._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{program.name}</CardTitle>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    program.status === "active"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {program.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {(() => {
                  const rules = program.rules as any;
                  if (program.type === "visit" && "visits" in rules) {
                    return `${rules.visits} visits → ${rules.reward}`;
                  } else if ("spendAmountCents" in rules) {
                    return `Spend $${(rules.spendAmountCents / 100).toFixed(
                      2
                    )} → ${rules.reward}`;
                  }
                  return "";
                })()}
              </p>
              {program.description && (
                <p className="text-sm">{program.description}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
