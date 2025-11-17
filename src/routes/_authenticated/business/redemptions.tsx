import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Undo2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/business/redemptions")({
  ssr: false,
  component: RedemptionsPage,
});

function RedemptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <RedemptionsContent />
    </Suspense>
  );
}

function RedemptionsContent() {
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
        <div className="p-6 text-muted-foreground">Loading redemptions...</div>
      }
    >
      <RedemptionsList businessId={businesses[0]._id} />
    </Suspense>
  );
}

function RedemptionsList({ businessId }: { businessId: Id<"businesses"> }) {
  const { data: redemptions } = useSuspenseQuery(
    convexQuery(api.businesses.queries.getRecentRedemptions, { businessId, limit: 100 })
  );
  const undoRedemption = useMutation(api.businesses.mutations.undoRewardRedemption);
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
    <div className="pb-28">
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">All Redemptions</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            View and manage all redeemed rewards
          </p>
        </div>

        {redemptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p className="text-lg">No redemptions yet</p>
              <p className="text-sm mt-2">Redeemed rewards will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {redemptions.map((redemption) => (
              <Card key={redemption._id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base">{redemption.rewardDescription}</p>
                      <p className="text-sm text-muted-foreground mt-1">{redemption.programName}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Code:</span>
                          <span className="font-mono text-sm font-semibold">{redemption.rewardCode}</span>
                        </div>
                        <span className="hidden sm:inline text-muted-foreground">•</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Redeemed:</span>
                          <span className="text-sm">
                            {redemption.redeemedAt && formatDistanceToNow(new Date(redemption.redeemedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUndo(redemption._id)}
                      disabled={undoingId === redemption._id}
                      className="shrink-0"
                    >
                      <Undo2 className="w-4 h-4 mr-1" />
                      Undo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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

