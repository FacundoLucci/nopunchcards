import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const isBusiness = searchParams.mode === "business";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        toast.error(error.message || "Signup failed");
        setLoading(false);
        return;
      }

      toast.success("Account created! Welcome to No Punch Cards");

      // Note: Profile will be created automatically when user first accesses
      // protected routes. This avoids race conditions with auth session sync.

      // If there's a referral param, redirect to that business page
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
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/50">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isBusiness ? "Business Owner Sign Up" : "Create Account"}
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
        </CardContent>
      </Card>
    </div>
  );
}
