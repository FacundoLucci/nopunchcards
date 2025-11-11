import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareYourPageCard } from "@/components/ShareYourPageCard";
import { Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/business/dashboard")({
  ssr: false,
  component: BusinessDashboard,
});

function BusinessDashboard() {
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
  businessId: any;
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

function ProgramsSection({ businessId }: { businessId: any }) {
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
                {program.rules.visits} visits → {program.rules.reward}
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
