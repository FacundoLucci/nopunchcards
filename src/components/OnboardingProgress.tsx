import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, CreditCard } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface OnboardingProgressProps {
  hasLinkedCard: boolean;
  isComplete: boolean;
  compact?: boolean;
}

export function OnboardingProgress({
  hasLinkedCard,
  isComplete,
  compact = false,
}: OnboardingProgressProps) {
  const navigate = useNavigate();

  if (isComplete) {
    return null; // Don't show if onboarding is complete
  }

  const progress = hasLinkedCard ? 100 : 0;

  if (compact) {
    // Compact banner for dashboard
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Complete your setup</p>
              <p className="text-xs text-muted-foreground">
                Link your card to start earning rewards
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate({ to: "/consumer/onboarding" })}
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full onboarding card
  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Setup</CardTitle>
        <CardDescription>
          Get started earning rewards in just one step
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {hasLinkedCard ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Link your credit or debit card</p>
              <p className="text-sm text-muted-foreground">
                Securely connect the card you use most often
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {!hasLinkedCard && (
          <Button
            className="w-full"
            onClick={() => navigate({ to: "/consumer/onboarding" })}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Link Your Card
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

