import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    // Use the userId already fetched in root's beforeLoad (no extra server call!)
    // This only blocks on SSR, on client navigation it's instant
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
    <div className="app-container min-h-screen">
      <Outlet />
    </div>
  );
}
