// Last updated: 2025-11-17 - Added free plan assignment on login
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  fetchSession,
  getCookieName,
} from "@convex-dev/better-auth/react-start";
import { getRequest, getCookie } from "@tanstack/react-start/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Smart redirect based on auth status and role
const getAppRedirect = createServerFn({ method: "GET" }).handler(async () => {
  // Get session from Better Auth
  const { session } = await fetchSession(getRequest());

  if (!session) {
    // Not logged in → redirect to login, then back to /app to determine role
    throw redirect({
      to: "/login",
      search: {
        redirect: "/app",
      },
    });
  }

  // Create Convex client to fetch profile
  const convexClient = new ConvexHttpClient(
    import.meta.env.VITE_CONVEX_URL || ""
  );

  // Fetch the user profile to determine role
  const { createAuth } = await import("../../convex/auth");
  const sessionCookieName = getCookieName(createAuth);
  const token = getCookie(sessionCookieName);

  if (token) {
    convexClient.setAuth(token);
  }

  // Query the profile from Convex
  const profile = await convexClient.query(api.users.getMyProfile, {});

  // If no profile exists, redirect to consumer onboarding as fallback
  // This should rarely happen now that profiles are created during signup
  if (!profile) {
    console.log(
      "[/app] No profile found - redirecting to consumer onboarding as fallback"
    );
    throw redirect({ to: "/consumer/onboarding" });
  }

  console.log("[/app] Profile found with role:", profile.role);

  // Ensure user has the free plan (for existing users who signed up before this feature)
  try {
    console.log("[/app] Ensuring user has free plan");
    const planResult = await convexClient.mutation(
      api.users.ensureFreePlan.ensureUserHasFreePlan,
      {}
    );
    if (planResult.assignedFreePlan) {
      console.log("[/app] Assigned free plan to user on login");
    }
  } catch (error) {
    console.error("[/app] Failed to ensure free plan:", error);
    // Don't block login if this fails
  }

  // Logged in with profile → redirect to appropriate dashboard based on role
  if (profile.role === "business_owner" || profile.role === "admin") {
    throw redirect({ to: "/business/dashboard" });
  } else {
    throw redirect({ to: "/consumer/home" });
  }
});

export const Route = createFileRoute("/app")({
  // Disable SSR - this is a client-only redirect handler
  ssr: false,
  beforeLoad: async () => {
    await getAppRedirect();
  },
});
