import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-clients";

export const Route = createFileRoute("/join/$slug")({
  // SSR enabled for Open Graph previews
  loader: async ({ params }) => {
    return { slug: params.slug };
  },
  component: PublicBusinessPage,
});

function PublicBusinessPage() {
  const navigate = useNavigate();
  const { slug } = Route.useLoaderData();
  const { data: session } = authClient.useSession();

  // Fetch business data client-side (will also work during SSR via ConvexQueryClient)
  const business = useQuery(api.businesses.public.getBySlug, { slug });
  
  // Always call hooks - pass skip condition to avoid running when business is not loaded
  const programs = useQuery(
    api.businesses.public.getActivePrograms,
    business ? { businessId: business._id } : "skip"
  );
  const stats = useQuery(
    api.businesses.public.getStats,
    business ? { businessId: business._id } : "skip"
  );

  const handleStartEarning = () => {
    if (session) {
      // Already logged in, redirect to dashboard
      navigate({ to: "/consumer/home" });
    } else {
      // Not logged in, redirect to signup with ref param
      navigate({ to: "/signup", search: { ref: slug } });
    }
  };

  if (business === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (business === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Business Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This business page doesn't exist
            </p>
            <Button onClick={() => navigate({ to: "/" })}>
              Explore Other Businesses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-[480px] mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Business Hero */}
        <div className="text-center space-y-4">
          {business.logoUrl && (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-24 h-24 mx-auto rounded-full border-4 border-border shadow-lg"
            />
          )}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{business.name}</h1>
            {business.status === "verified" ? (
              <Badge variant="default" className="bg-green-600">
                ✓ Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Pending Verification
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {business.category}
            {business.address && ` • ${business.address}`}
          </p>
        </div>

        {/* Verification Notice */}
        {business.status === "unverified" && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Business Under Review
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    This business is pending verification. You can still sign up and join their programs,
                    but automatic transaction matching will be enabled after verification is complete.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Value Prop */}
        <Card className="bg-linear-to-br from-secondary to-muted">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Sign up once,</h2>
            <p className="text-xl text-muted-foreground">
              get loyalty everywhere
            </p>
          </CardContent>
        </Card>

        {/* Social Proof */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats?.totalCustomers || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                customers earning here
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats?.totalRewards || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                rewards this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {business.description && (
          <p className="text-center text-muted-foreground">
            {business.description}
          </p>
        )}

        {/* Programs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Rewards at {business.name}</h2>
          {programs === undefined ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : programs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No active programs yet</p>
              </CardContent>
            </Card>
          ) : (
            programs.map((program: any) => {
              const rules = program.rules as any;
              const isVisitBased = program.type === "visit" && "visits" in rules;
              
              return (
                <Card key={program._id}>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="text-xl font-semibold text-center">
                      {program.name}
                    </h3>
                    {isVisitBased ? (
                      <>
                        <div className="flex gap-2 justify-center">
                          {Array.from({ length: rules.visits }).map(
                            (_, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full bg-muted"
                              />
                            )
                          )}
                        </div>
                        <div className="bg-muted rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-1">
                            Visit {rules.visits} times, earn:
                          </p>
                          <p className="text-lg font-semibold">
                            {rules.reward}
                          </p>
                          {rules.minimumSpendCents && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Min ${(rules.minimumSpendCents / 100).toFixed(2)} per visit
                            </p>
                          )}
                        </div>
                      </>
                    ) : "spendAmountCents" in rules ? (
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          Spend ${(rules.spendAmountCents / 100).toFixed(2)}, earn:
                        </p>
                        <p className="text-lg font-semibold">
                          {rules.reward}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* How It Works */}
        <div className="space-y-3">
          <h3 className="font-semibold">How it works</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span>1️⃣</span>
              <p>Link your card (one time)</p>
            </div>
            <div className="flex items-start gap-3">
              <span>2️⃣</span>
              <p>Shop like normal</p>
            </div>
            <div className="flex items-start gap-3">
              <span>3️⃣</span>
              <p>Earn rewards automatically</p>
            </div>
          </div>
        </div>

        {/* Platform Benefit */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="font-medium mb-2">Plus loyalty at 300+ businesses</p>
            <p className="text-sm text-muted-foreground">
              One account, all your local loyalty rewards in one place
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background via-background/95 to-transparent md:max-w-[480px] md:mx-auto">
        <Button
          onClick={handleStartEarning}
          className="w-full h-14 text-lg shadow-xl"
        >
          Start Earning Rewards →
        </Button>
      </div>
    </div>
  );
}
