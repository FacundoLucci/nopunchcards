import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareYourPageCard } from "@/components/ShareYourPageCard";
import { Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "../../../../convex/_generated/dataModel";

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

        {/* Redemption */}
        <RedeemRewardSection businessId={business._id} />

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

type RewardClaimSummary = {
  _id: Id<"rewardClaims">;
  businessId: Id<"businesses">;
  programName: string;
  rewardDescription: string;
  status: "pending" | "redeemed" | "cancelled";
  issuedAt: number;
  redeemedAt?: number;
};

type RewardActionResult = {
  outcome: "not_found" | "wrong_business" | "already_redeemed" | "success";
  claim?: RewardClaimSummary;
};

function RedeemRewardSection({ businessId }: { businessId: Id<"businesses"> }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RewardActionResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const previewReward = useMutation(api.businesses.mutations.previewRewardCode);
  const confirmReward = useMutation(
    api.businesses.mutations.confirmRewardRedemption
  );

  const normalizedCode = code.trim().toUpperCase();
  const claim = result?.claim;
  const canConfirm =
    result?.outcome === "success" && claim?.status === "pending";

  const handlePreview = async () => {
    if (!normalizedCode) {
      toast.error("Enter a reward code");
      return;
    }
    setIsChecking(true);
    try {
      const response = (await previewReward({
        businessId,
        rewardCode: normalizedCode,
      })) as RewardActionResult;
      setResult(response);
      if (response.outcome === "success") {
        toast.success("Reward ready to redeem");
      } else if (response.outcome === "already_redeemed") {
        toast.info("Reward already redeemed");
      } else if (response.outcome === "wrong_business") {
        toast.error("Code belongs to another business");
      } else {
        toast.error("Reward code not found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to verify reward code");
    } finally {
      setIsChecking(false);
    }
  };

  const handleConfirm = async () => {
    if (!normalizedCode || !canConfirm) return;
    setIsConfirming(true);
    try {
      const response = (await confirmReward({
        businessId,
        rewardCode: normalizedCode,
      })) as RewardActionResult;
      setResult(response);
      if (response.outcome === "success") {
        toast.success("Reward marked as redeemed");
        setCode("");
      } else if (response.outcome === "already_redeemed") {
        toast.info("Reward already redeemed");
      } else if (response.outcome === "wrong_business") {
        toast.error("Code belongs to another business");
      } else {
        toast.error("Reward code not found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to confirm reward");
    } finally {
      setIsConfirming(false);
    }
  };

  let statusMessage: { text: string; tone: "success" | "info" | "error" } | null =
    null;
  if (result) {
    if (result.outcome === "success") {
      statusMessage = { text: "Code verified. You can redeem it now.", tone: "success" };
    } else if (result.outcome === "already_redeemed") {
      statusMessage = { text: "This reward has already been redeemed.", tone: "info" };
    } else if (result.outcome === "wrong_business") {
      statusMessage = { text: "This code belongs to another business.", tone: "error" };
    } else {
      statusMessage = { text: "We couldn't find that reward code.", tone: "error" };
    }
  }

  const statusClasses =
    statusMessage?.tone === "success"
      ? "border-green-500/30 bg-green-50 text-green-800"
      : statusMessage?.tone === "info"
        ? "border-amber-400/40 bg-amber-50 text-amber-800"
        : "border-red-400/40 bg-red-50 text-red-800";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Redeem a reward</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Enter customer code
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="E.g. 8-character code"
              className="uppercase"
            />
            <Button
              onClick={handlePreview}
              disabled={isChecking}
              className="sm:w-36"
            >
              {isChecking ? "Checking..." : "Verify"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Customers can show you a QR or tell you this code after checkout.
          </p>
        </div>

        {result && statusMessage && (
          <div className={`rounded-lg border px-4 py-3 ${statusClasses}`}>
            <p className="font-medium">{statusMessage.text}</p>
            {claim && (
              <p className="text-sm">
                {claim.rewardDescription} • Earned{" "}
                {formatDistanceToNow(new Date(claim.issuedAt), {
                  addSuffix: true,
                })}
              </p>
            )}
            {result.outcome === "already_redeemed" && claim?.redeemedAt && (
              <p className="text-xs mt-1">
                Redeemed{" "}
                {formatDistanceToNow(new Date(claim.redeemedAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        )}

        <Button
          className="w-full"
          variant="default"
          disabled={!canConfirm || isConfirming}
          onClick={handleConfirm}
        >
          {isConfirming ? "Confirming..." : "Mark as redeemed"}
        </Button>
      </CardContent>
    </Card>
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
                    return `Spend $${(rules.spendAmountCents / 100).toFixed(2)} → ${rules.reward}`;
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
