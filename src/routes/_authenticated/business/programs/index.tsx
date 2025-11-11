import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/business/programs/")({
  ssr: false,
  component: ProgramsPage,
});

function ProgramsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <ProgramsContent />
    </Suspense>
  );
}

function ProgramsContent() {
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
    <div className="p-4 sm:p-6 space-y-6">
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading programs...</div>
        }
      >
        <ProgramsList businessId={businesses[0]._id} />
      </Suspense>
    </div>
  );
}

function ProgramsList({ businessId }: { businessId: any }) {
  const { data: programs } = useSuspenseQuery(
    convexQuery(api.rewardPrograms.mutations.listByBusiness, { businessId })
  );

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>No programs yet</p>
          <p className="text-sm mt-2">Create your first reward program</p>
        </CardContent>
      </Card>
    );
  }

  return programs.map((program) => (
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
  ));
}
