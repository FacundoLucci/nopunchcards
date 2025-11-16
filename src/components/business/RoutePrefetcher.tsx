import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-clients";

/**
 * Aggressively prefetches all main business routes on mount
 * For a simple app with minimal data, this ensures instant navigation
 */
export function BusinessRoutePrefetcher() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session) {
      return;
    }

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
  }, [router, session]);

  return null; // This component doesn't render anything
}
