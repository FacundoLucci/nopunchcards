import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
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
  const programs = business
    ? useQuery(api.businesses.public.getActivePrograms, {
        businessId: business._id,
      })
    : undefined;
  const stats = business
    ? useQuery(api.businesses.public.getStats, {
        businessId: business._id,
      })
    : undefined;

  const handleShare = async () => {
    const url = `${window.location.origin}/join/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Earn rewards at ${business?.name}`,
          text: "Sign up once, get loyalty everywhere",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied! Share with your customers");
      }
    } catch (error) {
      // User cancelled or error
    }
  };

  const handleStartEarning = () => {
    if (session) {
      // Already logged in, redirect to dashboard
      navigate({ to: "/consumer/dashboard" });
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
              This business page doesn't exist or hasn't been verified yet
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
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b py-4 px-6 flex items-center justify-between z-10">
        <button onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={handleShare}>
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      <div className="app-container p-6 space-y-8">
        {/* Business Hero */}
        <div className="text-center space-y-4">
          {business.logoUrl && (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-24 h-24 mx-auto rounded-full border-4 border-border shadow-lg"
            />
          )}
          <h1 className="text-3xl font-bold">{business.name}</h1>
          <p className="text-muted-foreground">
            {business.category}
            {business.address && ` • ${business.address}`}
          </p>
        </div>

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
            programs.map((program) => (
              <Card key={program._id}>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-xl font-semibold text-center">
                    {program.name}
                  </h3>
                  <div className="flex gap-2 justify-center">
                    {Array.from({ length: program.rules.visits }).map(
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
                      Visit {program.rules.visits} times, earn:
                    </p>
                    <p className="text-lg font-semibold">
                      {program.rules.reward}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
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
