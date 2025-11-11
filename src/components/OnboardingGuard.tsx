import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Client-side onboarding guard
 * Redirects to onboarding if incomplete
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

  useEffect(() => {
    // Skip if already on onboarding page
    if (location.pathname === "/consumer/onboarding") {
      return;
    }

    // Redirect if onboarding needed
    if (onboardingStatus && onboardingStatus.needsOnboarding) {
      navigate({ to: "/consumer/onboarding" });
    }
  }, [onboardingStatus, location.pathname, navigate]);

  // Always render children - the useEffect handles redirect
  // This prevents layout shift during navigation
  return <>{children}</>;
}

