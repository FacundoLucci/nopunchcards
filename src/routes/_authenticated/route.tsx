import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  // Enable SSR for server-side auth checks and instant redirects
  ssr: true,
  beforeLoad: async ({ location, context }) => {
    // Use cached auth from root route (already checked via fetchAuth)
    // This is instant - no HTTP request!
    if (!context.userId) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    return { userId: context.userId };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="app-container">
      <Outlet />
    </div>
  );
}
