import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareYourPageCard } from "@/components/ShareYourPageCard";
import { Settings, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/_authenticated/business/dashboard")({
  component: BusinessDashboard,
});

function BusinessDashboard() {
  const navigate = useNavigate();
  const businesses = useQuery(api.businesses.queries.getMyBusinesses, {});
  const programs = businesses?.[0]
    ? useQuery(api.rewardPrograms.mutations.listByBusiness, {
        businessId: businesses[0]._id,
      })
    : undefined;
  const stats = businesses?.[0]
    ? useQuery(api.businesses.queries.getDashboardStats, {
        businessId: businesses[0]._id,
      })
    : undefined;

  if (businesses === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Register Your Business</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              Get started by registering your business
            </p>
            <Button
              onClick={() => navigate({ to: "/business/register" })}
              className="w-full"
            >
              Register Business
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const business = businesses[0];

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b py-4 px-6 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold">{business.name}</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => navigate({ to: "/business/settings" })}>
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats?.totalVisits || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Visits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats?.totalRewards || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Rewards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats?.averageVisits || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg</p>
            </CardContent>
          </Card>
        </div>

        {/* Share Page Card */}
        <ShareYourPageCard slug={business.slug} />

        {/* Active Programs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Programs</h2>
            <Button
              size="sm"
              onClick={() => navigate({ to: "/business/programs/create" })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>

          {programs === undefined ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : programs.length === 0 ? (
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
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="max-w-[480px] mx-auto flex items-center justify-around py-3">
          <Button variant="default" className="flex-col h-auto py-2">
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2">
            <span className="text-xs">Programs</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2">
            <span className="text-xs">Analytics</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}

