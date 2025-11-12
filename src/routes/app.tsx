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

  // Logged in → redirect to appropriate dashboard based on role
  if (profile?.role === "business_owner") {
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
