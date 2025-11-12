import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

interface ProgressCardProps {
  businessName: string;
  currentVisits: number;
  totalVisits: number;
  rewardDescription: string;
  distance?: string;
  className?: string;
  onClick?: () => void;
}

export function ProgressCard({
  businessName,
  currentVisits,
  totalVisits,
  rewardDescription,
  distance,
  className,
  onClick,
}: ProgressCardProps) {
  // Generate deterministic random offset for punch hole effect
  const getPunchOffset = (index: number) => {
    // Use index to generate consistent but varied offsets
    const seed = index * 2654435761; // Large prime for distribution
    const x = ((seed * 1103515245 + 12345) % 5) - 2; // -2 to 2 pixels
    const y = ((seed * 1664525 + 1013904223) % 5) - 2; // -2 to 2 pixels
    return { x, y };
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
        {/* Progress dots with punch hole effect */}
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: totalVisits }).map((_, i) => {
            const offset = getPunchOffset(i);
            return (
              <div key={i} className="relative">
                {/* Main dot - 32px, always grey */}
                <div className="w-7 h-7 rounded-full bg-gray-300 transition-all relative">
                  {/* Punch hole - 16px with random offset, almost black */}
                  {i < currentVisits && (
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
          {currentVisits} of {totalVisits} visits
        </p>

        <div className="bg-muted rounded-lg p-3">
          <p className="text-sm font-medium">Reward: {rewardDescription}</p>
        </div>
      </CardContent>
    </Card>
  );
}
