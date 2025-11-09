import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchQuery } from "@/lib/auth-server";
import { api } from "../../../convex/_generated/api";

// Server function to check authentication using Convex
const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const user = await fetchQuery(api.auth.getCurrentUser, {});
  const isAuthenticated = !!user;
  const userId = user?.userId || user?._id;
  console.log("[Auth Check]", { isAuthenticated, userId });
  return { isAuthenticated, userId };
});

export const Route = createFileRoute("/_authenticated/_layout")({
  // Ensure SSR is enabled for auth checks
  ssr: true,
  beforeLoad: async ({ location }) => {
    // Always fetch fresh auth state from server
    const { isAuthenticated, userId } = await checkAuth();

    console.log("[Layout beforeLoad]", {
      isAuthenticated,
      userId,
      location: location.href,
    });

    if (!isAuthenticated) {
      console.log("[Layout beforeLoad] Redirecting to login...");
      // Redirect to login with the current location so we can redirect back after login
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    console.log("[Layout beforeLoad] User is authenticated, continuing...");
    return { userId };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="app-container min-h-screen">
      <Outlet />
    </div>
  );
}
