import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Suspense, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/business/analytics")({
  ssr: false,
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsContent() {
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

  return (
    <Suspense
      fallback={
        <div className="p-6 text-muted-foreground">Loading stats...</div>
      }
    >
      <StatsGrid businessId={businesses[0]._id} />
    </Suspense>
  );
}

function StatsGrid({ businessId }: { businessId: any }) {
  const { data: stats } = useSuspenseQuery(
    convexQuery(api.businesses.queries.getDashboardStats, { businessId })
  );

  return (
    <div className="pb-28">
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Detailed insights about your business performance
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalVisits || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalRewards || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalCustomers || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Visits per Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.averageVisits || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back button navigation */}
      <nav className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[480px] mx-auto px-6 flex justify-center">
          <Link
            to="/business/dashboard"
            className="pointer-events-auto bg-background/80 backdrop-blur-lg border shadow-lg rounded-full p-3 flex items-center justify-center transition-all hover:bg-accent/50 min-w-[48px] min-h-[48px]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>
      </nav>
    </div>
  );
}
