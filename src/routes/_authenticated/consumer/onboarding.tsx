import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { authClient } from "@/lib/auth-clients";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/consumer/onboarding")({
  component: ConsumerOnboarding,
});

function ConsumerOnboarding() {
  const navigate = useNavigate();
  const createLinkToken = useAction(api.plaid.linkToken.createLinkToken);
  const exchangeToken = useAction(api.plaid.exchangeToken.exchangePublicToken);
  const ensureProfile = useMutation(api.users.ensureProfile);
  const [loading, setLoading] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  // Ensure user has consumer profile when page loads
  // This is a fallback - profile should already exist from signup
  useEffect(() => {
    console.log("[Consumer Onboarding] Ensuring consumer profile...");
    ensureProfile({ role: "consumer" })
      .then((profileId) => {
        console.log("[Consumer Onboarding] Profile ensured:", profileId);
        setProfileReady(true);
      })
      .catch((error) => {
        console.error("[Consumer Onboarding] Failed to ensure profile:", error);
        setProfileReady(true); // Continue anyway, might already exist
      });
  }, [ensureProfile]);

  const startPlaidLink = async () => {
    if (!profileReady) {
      toast.error("Please wait while we set up your account");
      return;
    }

    setLoading(true);
    try {
      const { linkToken } = await createLinkToken({});

      // Initialize Plaid Link
      // @ts-ignore - Plaid Link will be loaded via script tag
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken: string) => {
          try {
            await exchangeToken({ publicToken });
            toast.success("Card linked successfully!");
            navigate({ to: "/consumer/home" });
          } catch (error) {
            toast.error("Failed to link card");
          }
        },
        onExit: () => {
          setLoading(false);
        },
      });

      handler.open();
    } catch (error) {
      toast.error("Failed to start Plaid Link");
      setLoading(false);
    }
  };

  // Show loading state while profile is being created
  if (!profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Setting up your account...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Welcome! 👋</CardTitle>
          <CardDescription className="text-lg">
            Link the card you use most to start earning rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <p>Securely connect your credit or debit card</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <p>Shop at participating businesses like normal</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <p>Earn rewards automatically—no punch cards needed</p>
            </div>
          </div>

          <Button
            onClick={startPlaidLink}
            className="w-full h-14 text-lg"
            disabled={loading}
          >
            {loading ? "Loading..." : "Link Your Card"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your financial data is encrypted and never shared with businesses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
