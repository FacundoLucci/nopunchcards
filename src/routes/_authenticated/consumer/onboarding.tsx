import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/consumer/onboarding")({
  component: ConsumerOnboarding,
});

function ConsumerOnboarding() {
  const navigate = useNavigate();
  const createLinkToken = useAction(api.plaid.linkToken.createLinkToken);
  const exchangeToken = useAction(api.plaid.exchangeToken.exchangePublicToken);
  const [loading, setLoading] = useState(false);

  const startPlaidLink = async () => {
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
            navigate({ to: "/consumer/dashboard" });
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
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

