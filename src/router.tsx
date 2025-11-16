import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { routeTree } from "./routeTree.gen";
import { AutumnWrapper } from "./components/AutumnWrapper";

export function getRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    throw new Error("missing VITE_CONVEX_URL envar");
  }
  const convex = new ConvexReactClient(CONVEX_URL, {
    unsavedChangesWarning: false,
  });
  const convexQueryClient = new ConvexQueryClient(convex);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        // Aggressive caching for instant navigation
        staleTime: Infinity, // Convex pushes updates automatically
        gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
        refetchOnWindowFocus: false, // Convex real-time handles updates
        refetchOnReconnect: false,
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      // Use viewport preloading - preloads any link that's visible on screen
      // This works for both mouse (on hover) and touch (when link is visible)
      defaultPreload: "viewport",
      defaultPreloadDelay: 50, // Start preloading quickly
      scrollRestoration: true,
      context: { queryClient, convexClient: convex, convexQueryClient },
      Wrap: ({ children }) => (
        <ConvexProvider client={convexQueryClient.convexClient}>
          <AutumnWrapper>
            {children}
          </AutumnWrapper>
        </ConvexProvider>
      ),
    }),
    queryClient
  );

  return router;
}
