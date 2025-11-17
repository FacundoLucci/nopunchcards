import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "convex/react";

/**
 * Client-side onboarding guard for consumer routes
 * Only redirects consumers who haven't completed onboarding
 * Business owners can access consumer routes without being forced through onboarding
 *
 * Benefits over server-side check:
 * - No blocking HTTP requests (0ms latency)
 * - Automatic caching (instant on repeated checks)
 * - Preloads on hover (ready before click)
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: onboardingStatus } = useSuspenseQuery(
    convexQuery(api.onboarding.queries.getOnboardingStatus, {})
  );

  // Get user profile to check role
  const profile = useQuery(api.users.getMyProfile, {});

  useEffect(() => {
    // Skip if already on onboarding page
    if (location.pathname === "/consumer/onboarding") {
      return;
    }

    // Only redirect consumers who need onboarding
    // Business owners can access consumer routes without onboarding
    if (
      onboardingStatus &&
      onboardingStatus.needsOnboarding &&
      profile?.role === "consumer"
    ) {
      navigate({ to: "/consumer/onboarding" });
    }
  }, [onboardingStatus, profile?.role, location.pathname, navigate]);

  // Always render children - the useEffect handles redirect
  // This prevents layout shift during navigation
  return <>{children}</>;
}
