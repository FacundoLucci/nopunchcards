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
        {/* Progress dots */}
        <div className="flex gap-2">
          {Array.from({ length: totalVisits }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                i < currentVisits ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
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

