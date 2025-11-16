import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-clients";
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

export const Route = createFileRoute("/login")({
  // SSR disabled for auth flows
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || "/app",
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Login failed");
        setLoading(false);
        return;
      }

      toast.success("Welcome back!");
      // Redirect back to where the user was trying to go, or to /app as default
      window.location.href = search.redirect;
    } catch (error) {
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
      <div className="hidden lg:flex lg:flex-1 bg-linear-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <LogoIcon
            withWordmark
            size={112}
            className="justify-center"
            wordmarkClassName="text-white text-6xl"
            imageClassName="ring-4 ring-white/30"
          />
          <h2 className="text-4xl font-bold text-center">Welcome Back</h2>
          <p className="text-xl text-center text-orange-50">
            Sign in to manage your loyalty rewards and discover local businesses
          </p>
          <div className="pt-4 space-y-3 text-orange-50">
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
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8">
          <LogoIcon
            withWordmark
            size={80}
            className="justify-center"
            wordmarkClassName="text-[#F03D0C] text-5xl"
          />
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Welcome back to Laso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <a href="/signup" className="text-primary hover:underline">
                Sign up
              </a>
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground">
                Are you a business owner?{" "}
                <a
                  href="/signup?mode=business"
                  className="text-primary hover:underline"
                >
                  Sign up for business
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
