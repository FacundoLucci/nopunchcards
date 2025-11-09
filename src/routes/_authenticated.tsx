import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { fetchQuery } from "@/lib/auth-server";
import { api } from "../../convex/_generated/api";

// Server function to check authentication using Convex
const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const user = await fetchQuery(api.auth.getCurrentUser, {});
  const isAuthenticated = !!user;
  const userId = user?.userId || user?._id;
  return { isAuthenticated, userId };
});

export const Route = createFileRoute("/_authenticated")({
  // Ensure SSR is enabled for auth checks
  ssr: true,
  // Cache the beforeLoad result to avoid re-checking auth on every navigation
  staleTime: 5000, // Consider auth valid for 5 seconds
  beforeLoad: async ({ location }) => {
    // Check auth state from server
    const { isAuthenticated, userId } = await checkAuth();

    if (!isAuthenticated) {
      // Redirect to login with the current location so we can redirect back after login
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

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
