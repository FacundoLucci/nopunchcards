import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface MultistepFormProps {
  steps: Array<{
    title: string;
    component: React.ReactNode;
    onNext?: () => Promise<boolean> | boolean;
  }>;
  onComplete: () => void;
  className?: string;
}

export function MultistepForm({ steps, onComplete, className }: MultistepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    const step = steps[currentStep];
    if (step.onNext) {
      const canProceed = await step.onNext();
      if (!canProceed) return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {/* Header with progress */}
      <div className="flex items-center justify-between p-4 border-b">
        {currentStep > 0 ? (
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
          >
            ←
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
        <span className="text-sm text-muted-foreground">
          {currentStep + 1} of {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-4 pt-4">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              idx <= currentStep ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-6">{currentStepData.title}</h2>
          {currentStepData.component}
        </div>

        {/* Continue button at bottom */}
        <Button
          onClick={handleNext}
          className="w-full h-12 mt-8"
          size="lg"
        >
          {currentStep < steps.length - 1 ? "Continue" : "Complete"}
        </Button>
      </div>
    </div>
  );
}

