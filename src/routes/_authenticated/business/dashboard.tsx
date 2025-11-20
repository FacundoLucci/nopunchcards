import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareYourPageCard } from "@/components/ShareYourPageCard";
import { BarChart3, QrCode, Eye, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-clients";
import type { Id } from "../../../../convex/_generated/dataModel";
import { RewardRedemptionDialog } from "@/components/business/RewardRedemptionDialog";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/business/dashboard")({
  // Client-side only - no server round-trips during navigation
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

      {/* Recent Redemptions */}
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading redemptions...</div>
        }
      >
        <RecentRedemptionsSection businessId={business._id} />
      </Suspense>

      {/* Share Page Card */}
      <ShareYourPageCard slug={business.slug} />
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
      <div className="flex items-center justify-around px-4">
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
  const [redemptionMethod, setRedemptionMethod] = useState<
    "code" | "scan" | null
  >(null);

  const handleMethodSelect = (method: "code" | "scan") => {
    setRedemptionMethod(method);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setRedemptionMethod(null);
    }
  };

  return (
    <>
      <Card className="pt-4 gap-3">
        <CardHeader>
          <CardTitle className="text-lg">Redeem a Reward</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full h-14"
            size="lg"
            onClick={() => handleMethodSelect("code")}
          >
            ENTER CODE
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>
          <Button
            className="w-full h-14"
            size="lg"
            onClick={() => handleMethodSelect("scan")}
          >
            <QrCode className="w-5 h-5 mr-2" />
            SCAN QR
          </Button>
        </CardContent>
      </Card>

      <RewardRedemptionDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        businessId={businessId}
        initialMethod={redemptionMethod}
      />
    </>
  );
}

function RecentRedemptionsSection({
  businessId,
}: {
  businessId: Id<"businesses">;
}) {
  const navigate = useNavigate();
  const { data: redemptions } = useSuspenseQuery(
    convexQuery(api.businesses.queries.getRecentRedemptions, {
      businessId,
      limit: 5,
    })
  );
  const undoRedemption = useMutation(
    api.businesses.mutations.undoRewardRedemption
  );
  const [undoingId, setUndoingId] = useState<Id<"rewardClaims"> | null>(null);

  const handleUndo = async (claimId: Id<"rewardClaims">) => {
    setUndoingId(claimId);
    try {
      const result = await undoRedemption({ businessId, claimId });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to undo redemption");
    } finally {
      setUndoingId(null);
    }
  };

  return (
    <Card className="pt-4 gap-3">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Recent Redemptions</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/business/redemptions" })}
          >
            <Eye className="w-4 h-4 mr-1" />
            <span className="hidden xs:inline">See All</span>
            <span className="xs:inline sm:hidden">All</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {redemptions.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            <p>No redemptions yet</p>
            <p className="text-sm mt-2">Redeemed rewards will appear here</p>
          </div>
        ) : (
          redemptions.map((redemption) => (
            <div
              key={redemption._id}
              className="border rounded-lg p-3 bg-muted/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {redemption.rewardDescription}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {redemption.programName}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="font-mono">{redemption.rewardCode}</span>
                    <span>•</span>
                    <span>
                      {redemption.redeemedAt &&
                        formatDistanceToNow(new Date(redemption.redeemedAt), {
                          addSuffix: true,
                        })}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUndo(redemption._id)}
                  disabled={undoingId === redemption._id}
                  className="shrink-0"
                >
                  <Undo2 className="w-4 h-4 mr-1" />
                  Undo
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
