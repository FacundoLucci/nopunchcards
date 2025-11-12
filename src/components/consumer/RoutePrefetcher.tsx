import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Aggressively prefetches all main consumer routes on mount
 * For a simple app with minimal data, this ensures instant navigation
 */
export function ConsumerRoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch all main consumer routes immediately
    const routesToPrefetch = [
      "/consumer/dashboard",
      "/consumer/cards",
      "/consumer/merchants",
      "/consumer/notifications",
      "/consumer/settings",
      "/consumer/rewards",
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

