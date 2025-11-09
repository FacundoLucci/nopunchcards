import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/programs/")({
  component: ProgramsPage,
});

function ProgramsPage() {
  const navigate = useNavigate();
  const businesses = useQuery(api.businesses.queries.getMyBusinesses, {});
  const programs = businesses?.[0]
    ? useQuery(api.rewardPrograms.mutations.listByBusiness, {
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
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Register your business first to create programs
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b py-4 px-6 z-10">
        <h1 className="text-xl font-bold">Programs</h1>
      </header>

      <div className="p-6 space-y-6">
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

      {/* FAB */}
      <button
        onClick={() => navigate({ to: "/business/programs/create" })}
        className="fixed bottom-20 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="max-w-[480px] mx-auto flex items-center justify-around py-3">
          <Button variant="ghost" className="flex-col h-auto py-2">
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button variant="default" className="flex-col h-auto py-2">
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

