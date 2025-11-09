import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ConsumerLayout } from "@/components/consumer/ConsumerLayout";
import { requireOnboarding } from "@/lib/onboarding-check";

export const Route = createFileRoute("/_authenticated/consumer/merchants")({
  ssr: true,
  beforeLoad: async ({ location }) => {
    await requireOnboarding(location.pathname);
  },
  component: MerchantsPage,
});

// Create a simple query to list verified businesses
function MerchantsPage() {
  const [search, setSearch] = useState("");

  // TODO: Create convex/consumer/getBusinesses query
  const businesses: any[] = [];

  return (
    <ConsumerLayout>
      <div className="p-6 space-y-6">
        {/* Search */}
        <Input
          type="search"
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Businesses List */}
        <div className="space-y-4">
          {businesses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No participating businesses yet</p>
                <p className="text-sm mt-2">Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            businesses.map((business) => (
              <Card key={business._id}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-1">{business.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {business.category}
                    {business.address && ` • ${business.address}`}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Programs
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ConsumerLayout>
  );
}

