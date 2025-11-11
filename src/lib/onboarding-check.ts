/**
 * Client-side onboarding check
 * 
 * Note: We no longer do server-side onboarding checks in beforeLoad
 * because it adds 300-500ms of latency on every navigation.
 * 
 * Instead, components use useSuspenseQuery to check onboarding status
 * and redirect if needed. This allows:
 * 1. Instant navigation (no blocking HTTP requests)
 * 2. Automatic caching (TanStack Query)
 * 3. Preloading on hover (router integration)
 * 
 * The OnboardingGuard component handles the actual redirect logic.
 */

export function requireOnboarding(_currentPath: string) {
  // No-op - onboarding is now checked client-side in components
  // This function remains for backwards compatibility but does nothing
  return;
}

