import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { X, ArrowLeft } from "lucide-react";

interface MultistepFormProps {
  title?: string;
  steps: Array<{
    title: string;
    component: React.ReactNode;
    onNext?: () => Promise<boolean> | boolean;
  }>;
  onComplete: () => void;
  onCancel?: () => void;
  className?: string;
}

export interface MultistepFormRef {
  next: () => Promise<void>;
}

export const MultistepForm = forwardRef<MultistepFormRef, MultistepFormProps>(
  function MultistepForm(
    { title, steps, onComplete, onCancel, className },
    ref
  ) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = useCallback(async () => {
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
    }, [currentStep, steps, onComplete]);

    // Expose handleNext through ref
    useImperativeHandle(
      ref,
      () => ({
        next: handleNext,
      }),
      [handleNext]
    );

    const handleBack = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    // Add Enter key support
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleNext();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext]); // Re-bind when handleNext changes

    const currentStepData = steps[currentStep];

    return (
      <div className={cn("min-h-screen flex flex-col", className)}>
        {/* Header with progress */}
        <div className="flex items-center justify-between p-4">
          {onCancel ? (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8 h-8" />
          )}
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </span>
          <ThemeToggle />
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
            {title && (
              <h1 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-wide">
                {title}
              </h1>
            )}
            <h2 className="text-2xl font-serif font-bold mb-6">
              {currentStepData.title}
            </h2>
            {currentStepData.component}
          </div>

          {/* Navigation buttons at bottom */}
          <div className="flex items-center gap-3 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-muted border"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Button onClick={handleNext} className="flex-1 h-12" size="lg">
              {currentStep < steps.length - 1 ? "Continue" : "Complete"}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
