// Last updated: 2025-11-17 - Client-side role-based redirect with loader
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchSession } from "@convex-dev/better-auth/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

// Server-side: Just check if logged in
const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { session } = await fetchSession(getRequest());

  if (!session) {
    throw redirect({
      to: "/login",
      search: {
        redirect: "/app",
      },
    });
  }
});

export const Route = createFileRoute("/app")({
  ssr: true,
  beforeLoad: async () => {
    await checkAuth();
  },
  component: AppRedirect,
});

function AppRedirect() {
  const navigate = useNavigate();
  const profile = useQuery(api.users.getMyProfile, {});

  useEffect(() => {
    if (profile === undefined) {
      // Still loading
      return;
    }

    if (profile === null) {
      // No profile found - redirect to consumer onboarding
      console.log("[/app] No profile - going to onboarding");
      navigate({ to: "/consumer/onboarding", replace: true });
      return;
    }

    // Redirect based on role
    if (profile.role === "business_owner" || profile.role === "admin") {
      console.log("[/app] Business owner - going to dashboard");
      navigate({ to: "/business/dashboard", replace: true });
    } else {
      console.log("[/app] Consumer - going to home");
      navigate({ to: "/consumer/home", replace: true });
    }
  }, [profile, navigate]);

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
