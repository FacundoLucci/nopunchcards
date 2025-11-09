import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { MultistepForm } from "@/components/MultistepForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/business/programs/create")({
  component: CreateProgram,
});

function CreateProgram() {
  const navigate = useNavigate();
  const businesses = useQuery(api.businesses.queries.getMyBusinesses, {});
  const createProgram = useMutation(api.rewardPrograms.mutations.create);

  const [name, setName] = useState("");
  const [visits, setVisits] = useState([5]);
  const [reward, setReward] = useState("");

  const steps = [
    {
      title: "What should we call this program?",
      component: (
        <div className="space-y-2">
          <Label htmlFor="programName">Program Name</Label>
          <Input
            id="programName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="5-Visit Punch Card"
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground">
            This is what customers will see
          </p>
        </div>
      ),
      onNext: () => {
        if (!name.trim()) {
          toast.error("Please enter a program name");
          return false;
        }
        return true;
      },
    },
    {
      title: "How many visits to earn a reward?",
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">{visits[0]}</div>
            <p className="text-muted-foreground">visits</p>
          </div>
          <Slider
            value={visits}
            onValueChange={setVisits}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground text-center">
            Most businesses choose 5-10
          </p>
        </div>
      ),
    },
    {
      title: "What do customers earn?",
      component: (
        <div className="space-y-2">
          <Label htmlFor="reward">Reward Description</Label>
          <Input
            id="reward"
            type="text"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Free medium coffee"
            className="text-lg"
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Common rewards:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Free item</li>
              <li>Discount (10% off)</li>
              <li>Free upgrade</li>
            </ul>
          </div>
        </div>
      ),
      onNext: () => {
        if (!reward.trim()) {
          toast.error("Please enter a reward description");
          return false;
        }
        return true;
      },
    },
    {
      title: "Does this look right?",
      component: (
        <div className="space-y-6">
          <Card className="card-playful">
            <CardHeader className="text-center">
              <h3 className="text-xl font-semibold">{name}</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 justify-center">
                {Array.from({ length: visits[0] }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-muted" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                0 of {visits[0]} visits
              </p>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-sm font-medium">{reward}</p>
              </div>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground text-center">
            This is how customers will see your program
          </p>
        </div>
      ),
    },
  ];

  const handleComplete = async () => {
    if (!businesses?.[0]) {
      toast.error("Business not found");
      return;
    }

    try {
      await createProgram({
        businessId: businesses[0]._id,
        name,
        rules: {
          visits: visits[0],
          reward,
        },
      });

      toast.success("Program created!");
      navigate({ to: "/business/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create program");
    }
  };

  return <MultistepForm steps={steps} onComplete={handleComplete} />;
}

