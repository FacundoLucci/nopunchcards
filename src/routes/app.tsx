// Last updated: 2025-11-20 - Fixed auth race condition with retry mechanism
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchSession } from "@convex-dev/better-auth/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

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
  // TypeScript has trouble with deeply nested Convex API types
  // @ts-expect-error - TS2589: Type instantiation is excessively deep
  const ensureProfileMutation = useMutation(api.users.ensureProfile);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (profile === undefined) {
      // Still loading
      return;
    }

    if (profile === null && !isCreatingProfile) {
      // No profile found - but this might be due to auth not being ready yet
      // Wait a bit longer before creating a default profile
      if (retryCount < 3) {
        console.log("[/app] No profile found, retrying...", retryCount + 1);
        const timeout = setTimeout(() => {
          setRetryCount(retryCount + 1);
        }, 500);
        return () => clearTimeout(timeout);
      }

      // After retries, create default consumer profile
      // /app doesn't indicate intent, so default to consumer
      console.log("[/app] No profile found after retries - creating consumer profile");
      setIsCreatingProfile(true);

      ensureProfileMutation({ role: "consumer" })
        .then((result) => {
          console.log(
            "[/app] Profile created:",
            result.profileId,
            "role:",
            result.role
          );
          // Profile is created, query will update and trigger redirect
          setIsCreatingProfile(false);
        })
        .catch((error) => {
          console.error("[/app] Failed to create profile:", error);
          // If ensureProfile failed, the profile might actually exist
          // Just wait for the query to update instead of forcing a redirect
          console.log("[/app] Waiting for profile query to update...");
          setIsCreatingProfile(false);
          setRetryCount(0); // Reset to allow query to retry
        });
      return;
    }

    if (profile) {
      // Reset retry count when profile is found
      if (retryCount > 0) {
        setRetryCount(0);
      }

      // Redirect based on role
      if (profile.role === "business_owner" || profile.role === "admin") {
        console.log("[/app] Business owner - going to dashboard");
        navigate({ to: "/business/dashboard", replace: true });
      } else {
        console.log("[/app] Consumer - going to home");
        navigate({ to: "/consumer/home", replace: true });
      }
    }
  }, [profile, navigate, ensureProfileMutation, isCreatingProfile, retryCount]);

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted-foreground">
          {isCreatingProfile ? "Setting up your account..." : "Loading..."}
        </p>
      </div>
    </div>
  );
}
