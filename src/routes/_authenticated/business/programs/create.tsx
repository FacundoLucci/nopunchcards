import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { MultistepForm, MultistepFormRef } from "@/components/MultistepForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_authenticated/business/programs/create"
)({
  component: CreateProgram,
});

type ProgramType = "visit" | "spend";

function CreateProgram() {
  const navigate = useNavigate();
  const businesses = useQuery(api.businesses.queries.getMyBusinesses, {});
  const createProgram = useMutation(api.rewardPrograms.mutations.create);
  const formRef = useRef<MultistepFormRef>(null);

  const [name, setName] = useState("");
  const [programType, setProgramType] = useState<ProgramType>("visit");
  const [visits, setVisits] = useState([5]);
  const [minimumSpend, setMinimumSpend] = useState("");
  const [spendAmount, setSpendAmount] = useState("");
  const [reward, setReward] = useState("");

  const steps = [
    {
      title: "What type of program?",
      component: (
        <div className="space-y-6">
          <RadioGroup
            value={programType}
            onValueChange={(value) => setProgramType(value as ProgramType)}
          >
            <div className="space-y-3">
              <div
                className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setProgramType("visit");
                  formRef.current?.next();
                }}
              >
                <RadioGroupItem value="visit" id="visit" />
                <Label
                  htmlFor="visit"
                  className="cursor-pointer flex-1 flex flex-col items-start"
                >
                  <div className="font-semibold">Visit-Based</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Reward customers after a certain number of visits
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Example: Visit 5 times, get a free coffee
                  </div>
                </Label>
              </div>

              <div
                className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setProgramType("spend");
                  formRef.current?.next();
                }}
              >
                <RadioGroupItem value="spend" id="spend" />
                <Label
                  htmlFor="spend"
                  className="cursor-pointer flex-1 flex flex-col items-start"
                >
                  <div className="font-semibold">Spend-Based</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Reward customers when they reach a spending goal
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Example: Spend $100, get $10 off
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      ),
    },
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
            placeholder={
              programType === "visit"
                ? "5-Visit Punch Card"
                : "Spend $100 Reward"
            }
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
    ...(programType === "visit"
      ? [
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
            title: "Minimum spend per visit? (Optional)",
            component: (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumSpend">Minimum Spend (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="minimumSpend"
                      type="number"
                      value={minimumSpend}
                      onChange={(e) => setMinimumSpend(e.target.value)}
                      placeholder="0.00"
                      className="text-lg pl-8"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Leave blank if there's no minimum spend requirement
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">
                    {minimumSpend && parseFloat(minimumSpend) > 0
                      ? `Each visit must have a minimum spend of $${parseFloat(
                          minimumSpend
                        ).toFixed(2)}`
                      : "No minimum spend required per visit"}
                  </p>
                </div>
              </div>
            ),
          },
        ]
      : [
          {
            title: "How much should customers spend?",
            component: (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="spendAmount">Total Spend Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="spendAmount"
                      type="number"
                      value={spendAmount}
                      onChange={(e) => setSpendAmount(e.target.value)}
                      placeholder="100.00"
                      className="text-lg pl-8"
                      step="0.01"
                      min="0.01"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total amount customers need to spend to earn the reward
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">
                    {spendAmount && parseFloat(spendAmount) > 0
                      ? `$${parseFloat(spendAmount).toFixed(2)}`
                      : "$0.00"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total spend needed
                  </p>
                </div>
              </div>
            ),
            onNext: () => {
              if (!spendAmount || parseFloat(spendAmount) <= 0) {
                toast.error("Please enter a valid spend amount");
                return false;
              }
              return true;
            },
          },
        ]),
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
            placeholder={
              programType === "visit"
                ? "Free medium coffee"
                : "$10 off next purchase"
            }
            className="text-lg"
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Common rewards:</p>
            <ul className="list-disc list-inside space-y-1">
              {programType === "visit" ? (
                <>
                  <li>Free item</li>
                  <li>Discount (10% off)</li>
                  <li>Free upgrade</li>
                </>
              ) : (
                <>
                  <li>Dollar amount off ($10 off)</li>
                  <li>Percentage off (20% off)</li>
                  <li>Free item or upgrade</li>
                </>
              )}
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
              <p className="text-sm text-muted-foreground capitalize">
                {programType}-based program
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {programType === "visit" ? (
                <>
                  <div className="flex gap-2 justify-center">
                    {Array.from({ length: visits[0] }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-full bg-muted" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    0 of {visits[0]} visits
                  </p>
                  {minimumSpend && parseFloat(minimumSpend) > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Minimum ${parseFloat(minimumSpend).toFixed(2)} per visit
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-4xl font-bold">
                      $
                      {spendAmount && parseFloat(spendAmount) > 0
                        ? parseFloat(spendAmount).toFixed(2)
                        : "0.00"}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total spend goal
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-0" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    $0.00 spent
                  </p>
                </>
              )}
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
      const rules =
        programType === "visit"
          ? {
              visits: visits[0],
              reward,
              ...(minimumSpend && parseFloat(minimumSpend) > 0
                ? {
                    minimumSpendCents: Math.round(
                      parseFloat(minimumSpend) * 100
                    ),
                  }
                : {}),
            }
          : {
              spendAmountCents: Math.round(parseFloat(spendAmount) * 100),
              reward,
            };

      await createProgram({
        businessId: businesses[0]._id,
        name,
        type: programType,
        rules: rules as any,
      });

      toast.success("Program created!");
      navigate({ to: "/business/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create program");
    }
  };

  const handleCancel = () => {
    navigate({ to: "/business/programs" });
  };

  return (
    <MultistepForm
      ref={formRef}
      title="Create a program"
      steps={steps}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
