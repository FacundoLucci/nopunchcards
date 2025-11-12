import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, Suspense, useEffect } from "react";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/consumer/merchants")({
  ssr: false,
  component: MerchantsPage,
});

function MerchantsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <OnboardingGuard>
        <MerchantsContent />
      </OnboardingGuard>
    </Suspense>
  );
}

function MerchantsContent() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Unable to get your location");
          // Use Chicago as fallback (where demo businesses are located)
          setUserLocation({ lat: 41.8781, lng: -87.6298 });
        }
      );
    } else {
      setLocationError("Geolocation not supported");
      // Use Chicago as fallback (where demo businesses are located)
      setUserLocation({ lat: 41.8781, lng: -87.6298 });
    }
  }, []);

  if (!userLocation) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Getting your location...
      </div>
    );
  }

  return <NearbyRewardsList userLocation={userLocation} locationError={locationError} />;
}

function NearbyRewardsList({
  userLocation,
  locationError,
}: {
  userLocation: { lat: number; lng: number };
  locationError: string | null;
}) {
  const { data: nearbyRewards } = useSuspenseQuery(
    convexQuery(api.consumer.queries.getNearbyRewards, {
      userLat: userLocation.lat,
      userLng: userLocation.lng,
      radiusMeters: 100000, // 100km radius (increased for better coverage)
    })
  );

  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Nearby Rewards</h2>
          {locationError && (
            <p className="text-xs text-muted-foreground mt-1">
              {locationError} - showing default area
            </p>
          )}
        </div>

        {nearbyRewards.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No rewards nearby</p>
              <p className="text-sm mt-2">Check back soon for new businesses!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {nearbyRewards.map((reward, index) => (
              <Card
                key={`${reward._id}-${index}`}
                className="hover:bg-accent transition-colors"
              >
                <CardContent className="py-3 px-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {reward.businessName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {reward.rewardDescription}
                        </p>
                        {reward.distance && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{formatDistance(reward.distance)} away</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {reward.currentProgress
                            ? `${reward.currentProgress.currentVisits}/${reward.visitsRequired}`
                            : `0/${reward.visitsRequired}`}
                        </p>
                      </div>
                    </div>
                    {reward.currentProgress && (
                      <Progress
                        value={
                          (reward.currentProgress.currentVisits /
                            reward.visitsRequired) *
                          100
                        }
                        className="h-1.5"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

