import {
  createFileRoute,
  useNavigate,
  useSearch,
  useRouteContext,
} from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-clients";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoIcon } from "@/components/LogoIcon";
import { getCookieName } from "@convex-dev/better-auth/react-start";

export const Route = createFileRoute("/signup")({
  // SSR disabled for auth flows
  // Auth token sync enabled for production
  ssr: false,
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const context = useRouteContext({ from: "__root__" });
  const searchParams = useSearch({ from: "/signup" }) as {
    ref?: string;
    mode?: "business" | "consumer";
  };

  // TypeScript has trouble with deeply nested Convex API types
  // @ts-ignore - TS2589: Type instantiation is excessively deep
  const createProfile = useMutation(api.users.signup.createProfileAfterSignup);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const isBusiness = searchParams.mode === "business";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const role = isBusiness ? "business_owner" : "consumer";

      // Step 1: Create Better Auth account
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        toast.error(error.message || "Signup failed");
        setLoading(false);
        return;
      }

      // Step 2: Refresh Convex auth token
      // After signup, Better Auth sets a session cookie, but Convex client doesn't know about it yet
      // We need to manually update the Convex client's auth token
      console.log("[Signup] Refreshing Convex auth token...");

      try {
        // Get the session cookie name
        const { createAuth } = await import("../../convex/auth");
        const cookieName = getCookieName(createAuth);

        // Get the token from the cookie
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${cookieName}=`))
          ?.split("=")[1];

        if (token) {
          // Update Convex client with new auth token
          await context.convexClient.setAuth(async () => token);
          console.log("[Signup] Auth token refreshed successfully");

          // Wait a moment for Convex to apply the new auth
          await new Promise((resolve) => setTimeout(resolve, 200));
        } else {
          console.warn("[Signup] No session token found in cookies");
        }
      } catch (authError) {
        console.error("[Signup] Failed to refresh auth token:", authError);
      }

      // Step 3: Create/verify profile with role
      // Now that Convex has the auth token, this should work
      console.log("[Signup] Creating profile with role:", role);

      try {
        const result = await createProfile({ role });
        console.log(
          "[Signup] Profile created:",
          result.profileId,
          "wasCreated:",
          result.wasCreated
        );
      } catch (err: any) {
        // If profile creation still fails, it will be auto-created on first app load
        // This is a fallback safety mechanism
        console.warn(
          "[Signup] Profile creation failed, will auto-create on first load:",
          err.message
        );
      }

      toast.success("Account created! Welcome to Laso!");

      // Step 3: Redirect to appropriate onboarding/registration
      // The path itself indicates the intended role - no need for search params
      if (searchParams.ref) {
        navigate({ to: `/join/${searchParams.ref}` });
      } else if (isBusiness) {
        // Business signup: redirect to business registration
        // Path contains "business" → infers business_owner role
        navigate({ to: "/business/register" });
      } else {
        // Consumer signup: redirect to consumer onboarding
        // Path contains "consumer" → infers consumer role
        navigate({ to: "/consumer/onboarding" });
      }
    } catch (error) {
      console.error("[Signup] Unexpected error:", error);
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:flex-1 bg-linear-to-br from-brand-primary to-brand-primary-dark dark:from-brand-primary-dark dark:to-brand-primary items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <LogoIcon
            showIcon={false}
            showWordmark
            size={82}
            className="justify-center"
            wordmarkClassName="text-white text-8xl tracking-normal"
          />
          <h2 className="text-4xl font-bold text-center">
            {isBusiness ? "Grow Your Business" : "Join Laso"}
          </h2>
          <p className="text-xl text-center text-orange-50">
            {isBusiness
              ? "Create modern loyalty programs that keep customers coming back"
              : "Say goodbye to punch cards and hello to automatic rewards"}
          </p>
          <div className="pt-4 space-y-3 text-orange-50">
            {isBusiness ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="mt-1">✓</div>
                  <div>
                    <strong>Easy Setup</strong>
                    <p className="text-sm">
                      Create your loyalty program in minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">✓</div>
                  <div>
                    <strong>Automatic Tracking</strong>
                    <p className="text-sm">
                      No more punch cards or apps to maintain
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">✓</div>
                  <div>
                    <strong>Happy Customers</strong>
                    <p className="text-sm">
                      Reward loyalty and drive repeat business
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="mt-1">✓</div>
                  <div>
                    <strong>Automatic Rewards</strong>
                    <p className="text-sm">
                      Earn points with every purchase, no punch cards needed
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">✓</div>
                  <div>
                    <strong>Support Local</strong>
                    <p className="text-sm">
                      Discover and support independent businesses in your area
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">✓</div>
                  <div>
                    <strong>One Account</strong>
                    <p className="text-sm">
                      Track all your loyalty programs in one place
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8">
          <LogoIcon
            showIcon
            showWordmark
            size={42}
            className="justify-center"
            wordmarkClassName="text-[var(--brand-primary)] text-5xl"
          />
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isBusiness ? "Create Business Account" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {searchParams.ref
                ? "Sign up once, get loyalty everywhere"
                : isBusiness
                ? "Create an account to register your business"
                : "Start earning rewards at local businesses"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground">
                {isBusiness ? (
                  <>
                    Not a business owner?{" "}
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/signup",
                          search: { mode: "consumer" },
                        })
                      }
                      className="text-primary hover:underline"
                    >
                      Sign up as a customer
                    </button>
                  </>
                ) : (
                  <>
                    Are you a business owner?{" "}
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/signup",
                          search: { mode: "business" },
                        })
                      }
                      className="text-primary hover:underline"
                    >
                      Sign up for business
                    </button>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
