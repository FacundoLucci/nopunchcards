import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/business/programs/")({
  ssr: false,
  component: ProgramsPage,
});

type RewardProgram = {
  _id: Id<"rewardPrograms">;
  name: string;
  description?: string;
  type: "visit" | "spend";
  rules:
    | { visits: number; reward: string; minimumSpendCents?: number }
    | { spendAmountCents: number; reward: string };
  status: "active" | "paused" | "archived";
};

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

  const businessId = businesses[0]._id as Id<"businesses">;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Reward Programs</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Create, update, or retire the loyalty programs customers interact
          with.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading programs...</div>
        }
      >
        <ProgramsList businessId={businessId} />
      </Suspense>
    </div>
  );
}

function ProgramsList({ businessId }: { businessId: Id<"businesses"> }) {
  const navigate = useNavigate();
  const { data: programs } = useSuspenseQuery(
    convexQuery(api.rewardPrograms.mutations.listByBusiness, { businessId })
  );

  const handleOpenEditor = (program: RewardProgram) => {
    navigate({
      to: "/business/programs/$programId/edit",
      params: { programId: program._id },
    });
  };

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground space-y-2">
          <p className="text-lg font-semibold">No programs yet</p>
          <p className="text-sm">
            Create your first reward program to start awarding loyal customers.
          </p>
          <Button asChild size="sm" className="mt-2">
            <Link to="/business/programs/create">Create program</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {programs.map((program: RewardProgram) => (
        <Card
          key={program._id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleOpenEditor(program)}
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{program.name}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="capitalize">{program.type}-based</span>
                  <span>•</span>
                  <ProgramStatusBadge status={program.status} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgramDetails program={program} />
            {program.description && (
              <p className="text-sm text-muted-foreground">
                {program.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProgramStatusBadge({ status }: { status: RewardProgram["status"] }) {
  const styles =
    status === "active"
      ? "bg-green-500/20 text-green-700"
      : status === "paused"
      ? "bg-amber-500/20 text-amber-700"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${styles}`}
    >
      {status}
    </span>
  );
}

function ProgramDetails({ program }: { program: RewardProgram }) {
  const description = useMemo(() => {
    if (program.type === "visit" && "visits" in program.rules) {
      const minimumSpend =
        program.rules.minimumSpendCents && program.rules.minimumSpendCents > 0
          ? ` (Min $${(program.rules.minimumSpendCents / 100).toFixed(
              2
            )}/visit)`
          : "";
      return `${program.rules.visits} visits → ${program.rules.reward}${minimumSpend}`;
    }

    if (
      program.type === "spend" &&
      "spendAmountCents" in program.rules &&
      "reward" in program.rules
    ) {
      return `Spend $${(program.rules.spendAmountCents / 100).toFixed(2)} → ${
        program.rules.reward
      }`;
    }

    return "";
  }, [program]);

  return (
    <p className="text-sm text-muted-foreground">
      {description || "Custom reward rules"}
    </p>
  );
}
