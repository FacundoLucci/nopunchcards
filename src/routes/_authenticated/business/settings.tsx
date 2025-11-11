import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Mail, Calendar } from "lucide-react";
import { Suspense } from "react";

export const Route = createFileRoute("/_authenticated/business/settings")({
  ssr: false,
  component: BusinessSettings,
});

function BusinessSettings() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { data: businesses } = useSuspenseQuery(
    convexQuery(api.businesses.queries.getMyBusinesses, {})
  );

  const business = businesses?.[0]; // Use the first business for now

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container max-w-4xl py-4 px-4 sm:py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Manage your business profile and settings
        </p>
      </div>

      {business ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Your business information and details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Business Name
                    </label>
                    <p className="text-base sm:text-lg font-semibold wrap-break-word">
                      {business.name}
                    </p>
                  </div>

                  {business.slug && (
                    <div className="min-w-0">
                      <label className="text-sm font-medium text-muted-foreground block mb-1">
                        Business URL
                      </label>
                      <p className="text-xs sm:text-sm font-mono bg-muted px-2 py-1.5 rounded break-all">
                        {window.location.origin}/join/{business.slug}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Member since {formatDate(business._creationTime)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>
                Your current business account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-green-500 shrink-0">Active</Badge>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Your business account is active and operational
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base">
                        Email Notifications
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Receive updates about your programs and customers
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Business Profile
              </h3>
              <p className="text-muted-foreground mb-6">
                Complete business registration to view settings
              </p>
              <Button asChild>
                <a href="/business/register">Complete Registration</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
