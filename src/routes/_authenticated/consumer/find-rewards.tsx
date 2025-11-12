import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { useState, Suspense, useEffect } from "react";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/consumer/find-rewards")({
  ssr: false,
  component: FindRewardsPage,
});

function FindRewardsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-muted-foreground">Loading...</div>}
    >
      <OnboardingGuard>
        <FindRewardsContent />
      </OnboardingGuard>
    </Suspense>
  );
}

function FindRewardsContent() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
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

  return (
    <NearbyRewardsList
      userLocation={userLocation}
      locationError={locationError}
    />
  );
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

  // Group rewards by business
  const businessMap = new Map<
    string,
    {
      businessName: string;
      distance?: number;
      rewards: Array<{ 
        description: string; 
        programType: string;
        visits?: number; 
        spendAmountCents?: number;
        minimumSpendCents?: number;
      }>;
    }
  >();

  nearbyRewards.forEach((reward) => {
    const businessId = reward._id;
    if (!businessMap.has(businessId)) {
      businessMap.set(businessId, {
        businessName: reward.businessName,
        distance: reward.distance,
        rewards: [],
      });
    }
    const business = businessMap.get(businessId)!;
    business.rewards.push({
      description: reward.rewardDescription,
      programType: reward.programType,
      visits: reward.visitsRequired,
      spendAmountCents: reward.spendAmountCents,
      minimumSpendCents: reward.minimumSpendCents,
    });
  });

  const businesses = Array.from(businessMap.values());

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

      {businesses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No rewards nearby</p>
            <p className="text-sm mt-2">Check back soon for new businesses!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {businesses.map((business, index) => (
            <Card
              key={`${business.businessName}-${index}`}
              className="hover:bg-accent transition-colors py-0"
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold">{business.businessName}</h3>
                    {business.distance !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{formatDistance(business.distance)} away</span>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-1 list-disc list-inside">
                    {business.rewards.slice(0, 3).map((reward, idx) => {
                      let rewardText = "";
                      if (reward.programType === "visit" && reward.visits) {
                        rewardText = `Visit ${reward.visits} times`;
                        if (reward.minimumSpendCents) {
                          rewardText += ` (min $${(reward.minimumSpendCents / 100).toFixed(2)}/visit)`;
                        }
                        rewardText += `, get ${reward.description}`;
                      } else if (reward.programType === "spend" && reward.spendAmountCents) {
                        rewardText = `Spend $${(reward.spendAmountCents / 100).toFixed(2)}, get ${reward.description}`;
                      }
                      
                      return (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground"
                          style={{
                            textIndent: "-1.25rem",
                            paddingLeft: "1.25rem",
                          }}
                        >
                          {rewardText}
                        </li>
                      );
                    })}
                    {business.rewards.length > 3 && (
                      <li className="text-sm text-muted-foreground italic list-none">
                        +{business.rewards.length - 3} more rewards
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
