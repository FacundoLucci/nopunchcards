import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
// import { TanStackDevtools } from "@tanstack/react-devtools";
import { useRef } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

import { createServerFn } from "@tanstack/react-start";
import { QueryClient } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexReactClient } from "convex/react";
import { getCookie, getRequest } from "@tanstack/react-start/server";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
  fetchSession,
  getCookieName,
} from "@convex-dev/better-auth/react-start";
import { authClient } from "@/lib/auth-clients";

// Get auth information for SSR using available cookies
const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { createAuth } = await import("../../convex/auth");
  const { session } = await fetchSession(getRequest());
  const sessionCookieName = getCookieName(createAuth);
  const token = getCookie(sessionCookieName);
  return {
    userId: session?.user.id,
    token,
  };
});

// Cache auth result to prevent duplicate calls during route preloading
let authCache: { userId?: string; token?: string; timestamp: number } | null =
  null;
const CACHE_DURATION = 1000; // 1 second cache

async function getCachedAuth() {
  const now = Date.now();

  // Return cached result if fresh (< 1 second old)
  if (authCache && now - authCache.timestamp < CACHE_DURATION) {
    return { userId: authCache.userId, token: authCache.token };
  }

  // Fetch fresh auth data
  const { userId, token } = await fetchAuth();

  // Update cache
  authCache = { userId, token, timestamp: now };

  return { userId, token };
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  userId?: string;
  token?: string;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Laso - The last loyalty program humanity will ever need",
      },
      // PWA: Dynamic theme color based on color scheme
      {
        name: "theme-color",
        content: "#ffffff",
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: "#1a1625",
        media: "(prefers-color-scheme: dark)",
      },
      // iOS PWA: Enable standalone mode
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      // iOS PWA: Status bar style (default = white bar for light mode)
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      // iOS PWA: App title
      {
        name: "apple-mobile-web-app-title",
        content: "Laso",
      },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
    scripts: [
      {
        src: "https://cdn.plaid.com/link/v2/stable/link-initialize.js",
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    // all queries, mutations and action made with TanStack Query will be
    // authenticated by an identity token.

    // Use cached auth to prevent duplicate server calls during preloading
    const { userId, token } = await getCachedAuth();

    // During SSR only (the only time serverHttpClient exists),
    // set the auth token to make HTTP queries with.
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return { userId, token };
  },
  component: RootComponent,
});

function RootComponent() {
  const context = useRouteContext({ from: Route.id });

  const tokenRef = useRef<string | undefined>(undefined);
  if (tokenRef.current !== context.token) {
    // Convex now requires an async function instead of a string
    context.convexClient.setAuth(async () => context.token ?? null);
    tokenRef.current = context.token;
  }

  return (
    <ConvexBetterAuthProvider
      client={context.convexClient}
      authClient={authClient}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexBetterAuthProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          {children}
          <Toaster />
        </ThemeProvider>
        {/*
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        */}
        <Scripts />
      </body>
    </html>
  );
}
