import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchQuery } from "@/lib/auth-server";
import { api } from "../../convex/_generated/api";

/**
 * Server function to check onboarding status
 * Used in consumer route beforeLoad hooks
 */
export const checkOnboarding = createServerFn({ method: "GET" }).handler(
  async () => {
    const onboardingStatus = await fetchQuery(
      api.onboarding.queries.getOnboardingStatus,
      {}
    );
    return onboardingStatus;
  }
);

/**
 * Utility to check onboarding and redirect if incomplete
 * Use in beforeLoad for consumer routes that require onboarding
 */
export async function requireOnboarding(currentPath: string) {
  // Skip check if on onboarding page
  if (currentPath === "/consumer/onboarding") {
    return;
  }

  const onboardingStatus = await checkOnboarding();

  if (onboardingStatus && onboardingStatus.needsOnboarding) {
    throw redirect({
      to: "/consumer/onboarding",
    });
  }
}

