import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../../../convex/_generated/api";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_authenticated/consumer/rewards/$claimId/claim"
)({
  ssr: false,
  component: ClaimPage,
});

function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading reward...</div>
        </div>
      }
    >
      <OnboardingGuard>
        <ClaimContent />
      </OnboardingGuard>
    </Suspense>
  );
}

function ClaimContent() {
  const { claimId } = Route.useParams();
  const { data: claim } = useSuspenseQuery(
    convexQuery(api.consumer.queries.getRewardClaim, { claimId })
  );

  if (!claim) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold">Reward not found</p>
        <p className="text-muted-foreground text-sm">
          This reward is no longer available or may have already been redeemed.
        </p>
        <Link to="/consumer/rewards">
          <Button>Back to rewards</Button>
        </Link>
      </div>
    );
  }

  const isRedeemed = claim.status === "redeemed";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(claim.rewardCode);
      toast.success("Reward code copied");
    } catch (error) {
      toast.error("Unable to copy code");
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/consumer/rewards">
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            Reward from {claim.businessName}
          </span>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-2 text-center">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {claim.programName}
            </p>
            <h1 className="text-2xl font-semibold">{claim.rewardDescription}</h1>
            <p className="text-sm text-muted-foreground">
              Earned{" "}
              {formatDistanceToNow(new Date(claim.issuedAt), {
                addSuffix: true,
              })}
            </p>
          </CardContent>
        </Card>

        {isRedeemed ? (
          <RedeemedState redeemedAt={claim.redeemedAt} />
        ) : (
          <PendingState
            qrPayload={claim.qrPayload}
            rewardCode={claim.rewardCode}
            onCopyCode={copyCode}
          />
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How it works</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Show the QR or code to the cashier.</li>
            <li>They scan or enter the code on their dashboard.</li>
            <li>Once confirmed, your reward is marked as used.</li>
          </ol>
          {isRedeemed && claim.redeemedAt && (
            <p className="text-xs">
              Redeemed on {format(new Date(claim.redeemedAt), "MMM d, yyyy p")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PendingState({
  qrPayload,
  rewardCode,
  onCopyCode,
}: {
  qrPayload: string;
  rewardCode: string;
  onCopyCode: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col items-center gap-4">
        <QRCode value={qrPayload} size={200} className="bg-white p-2 rounded-xl" />
        <p className="text-sm text-muted-foreground text-center">
          Cashiers can scan this QR code or enter the code below.
        </p>
      </div>

      <div className="bg-muted rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <code className="font-mono text-lg tracking-[0.3em]">
          {rewardCode}
        </code>
        <Button variant="secondary" size="sm" onClick={onCopyCode}>
          Copy
        </Button>
      </div>
    </div>
  );
}

function RedeemedState({ redeemedAt }: { redeemedAt?: number }) {
  return (
    <Card className="bg-emerald-50 border-emerald-200">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        <div>
          <p className="text-lg font-semibold text-emerald-700">
            Reward redeemed!
          </p>
          {redeemedAt && (
            <p className="text-sm text-emerald-800">
              Confirmed on {format(new Date(redeemedAt), "MMM d, yyyy p")}
            </p>
          )}
        </div>
        <Link to="/consumer/rewards">
          <Button variant="outline">Back to rewards</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
