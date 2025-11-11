import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Aggressively prefetches all main business routes on mount
 * For a simple app with minimal data, this ensures instant navigation
 */
export function BusinessRoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch all main business routes immediately
    const routesToPrefetch = [
      "/business/dashboard",
      "/business/analytics",
      "/business/programs",
      "/business/settings",
    ];

    // Small delay to let initial route settle, then prefetch everything
    const timer = setTimeout(() => {
      routesToPrefetch.forEach((to) => {
        router.preloadRoute({ to } as any).catch(() => {
          // Silently ignore prefetch errors
        });
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return null; // This component doesn't render anything
}

