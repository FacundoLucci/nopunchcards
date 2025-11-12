import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

interface BaseProgressCardProps {
  businessName: string;
  rewardDescription: string;
  distance?: string;
  className?: string;
  onClick?: () => void;
}

interface VisitProgressCardProps extends BaseProgressCardProps {
  programType: "visit";
  currentVisits: number;
  totalVisits: number;
  minimumSpendCents?: number;
}

interface SpendProgressCardProps extends BaseProgressCardProps {
  programType: "spend";
  currentSpendCents: number;
  totalSpendCents: number;
}

type ProgressCardProps = VisitProgressCardProps | SpendProgressCardProps;

export function ProgressCard(props: ProgressCardProps) {
  const {
    businessName,
    rewardDescription,
    distance,
    className,
    onClick,
    programType,
  } = props;

  // Generate deterministic random offset for punch hole effect
  const getPunchOffset = (index: number) => {
    // Use index to generate consistent but varied offsets
    const seed = index * 2654435761; // Large prime for distribution
    const x = ((seed * 1103515245 + 12345) % 5) - 2; // -2 to 2 pixels
    const y = ((seed * 1664525 + 1013904223) % 5) - 2; // -2 to 2 pixels
    return { x, y };
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]",
        "card-playful",
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{businessName}</CardTitle>
          {distance && (
            <span className="text-sm text-muted-foreground">{distance}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {programType === "visit" ? (
          <>
            {/* Progress dots with punch hole effect */}
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: props.totalVisits }).map((_, i) => {
                const offset = getPunchOffset(i);
                return (
                  <div key={i} className="relative">
                    {/* Main dot - 32px, always grey */}
                    <div className="w-7 h-7 rounded-full bg-gray-300 transition-all relative">
                      {/* Punch hole - 16px with random offset, almost black */}
                      {i < props.currentVisits && (
                        <div
                          className="absolute w-4 h-4 bg-black rounded-full"
                          style={{
                            left: `calc(50% - 0.5rem + ${offset.x}px)`,
                            top: `calc(50% - 0.5rem + ${offset.y}px)`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-muted-foreground">
              {props.currentVisits} of {props.totalVisits} visits
              {props.minimumSpendCents && props.minimumSpendCents > 0 && (
                <span className="block text-xs mt-1">
                  Min {formatCurrency(props.minimumSpendCents)} per visit
                </span>
              )}
            </p>
          </>
        ) : (
          <>
            {/* Spend-based progress bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (props.currentSpendCents / props.totalSpendCents) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(props.currentSpendCents)} of{" "}
                {formatCurrency(props.totalSpendCents)} spent
              </p>
            </div>
          </>
        )}

        <div className="bg-muted rounded-lg p-3">
          <p className="text-sm font-medium">Reward: {rewardDescription}</p>
        </div>
      </CardContent>
    </Card>
  );
}
