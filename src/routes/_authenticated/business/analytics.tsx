import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/_authenticated/business/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const businesses = useQuery(api.businesses.queries.getMyBusinesses, {});
  const stats = businesses?.[0]
    ? useQuery(api.businesses.queries.getDashboardStats, {
        businessId: businesses[0]._id,
      })
    : undefined;

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b py-4 px-6 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold">Analytics</h1>
        <ThemeToggle />
      </header>

      <div className="p-6 space-y-6">
        <div className="grid gap-4">
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="max-w-[480px] mx-auto flex items-center justify-around py-3">
          <Button variant="ghost" className="flex-col h-auto py-2">
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2">
            <span className="text-xs">Programs</span>
          </Button>
          <Button variant="default" className="flex-col h-auto py-2">
            <span className="text-xs">Analytics</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}

