import {
  createFileRoute,
  useNavigate,
  useSearch,
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

export const Route = createFileRoute("/signup")({
  // SSR disabled for auth flows
  ssr: false,
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
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

      // Step 2: Wait for session to sync, then create Convex profile
      // There's a brief delay between Better Auth signup and Convex session sync
      try {
        const role = isBusiness ? "business_owner" : "consumer";
        console.log("[Signup] Waiting for session sync...");

        // Retry profile creation with exponential backoff
        let attempts = 0;
        const maxAttempts = 5;
        let profileCreated = false;

        while (attempts < maxAttempts && !profileCreated) {
          try {
            const delay = Math.min(100 * Math.pow(2, attempts), 2000); // 100ms, 200ms, 400ms, 800ms, 1600ms
            if (attempts > 0) {
              console.log(
                `[Signup] Retry ${attempts}/${maxAttempts} after ${delay}ms...`
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
            }

            console.log(
              `[Signup] Attempting to create profile with role: ${role}`
            );
            const result = await createProfile({ role });

            console.log(
              "[Signup] Profile created:",
              result.profileId,
              "wasCreated:",
              result.wasCreated
            );
            profileCreated = true;
          } catch (err: any) {
            attempts++;
            if (
              err.message?.includes("Unauthenticated") &&
              attempts < maxAttempts
            ) {
              // Session not synced yet, will retry
              console.log(`[Signup] Session not synced yet, retrying...`);
            } else {
              throw err; // Re-throw if it's not an auth error or we're out of attempts
            }
          }
        }

        if (!profileCreated) {
          throw new Error("Failed to create profile after multiple attempts");
        }
      } catch (profileError) {
        console.error("[Signup] Failed to create profile:", profileError);
        // Don't block signup if profile creation fails - it will be created in onboarding
        console.log(
          "[Signup] Profile will be created during onboarding as fallback"
        );
      }

      toast.success("Account created! Welcome to Laso!");

      // Step 3: Redirect to appropriate onboarding/registration
      // Profile now exists with correct role before redirect
      if (searchParams.ref) {
        navigate({ to: `/join/${searchParams.ref}` });
      } else if (isBusiness) {
        // Business signup: redirect to business registration
        navigate({ to: "/business/register" });
      } else {
        // Consumer signup: redirect to consumer onboarding
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
