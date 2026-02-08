import { cn } from "@/lib/utils/cn";

interface StepIndicatorProps {
  currentStep: 1 | 2;
  totalSteps?: number;
}

export function StepIndicator({ currentStep, totalSteps = 2 }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        return (
          <div
            key={step}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              step === currentStep
                ? "bg-foreground"
                : step < currentStep
                  ? "bg-foreground/40"
                  : "bg-foreground/15",
            )}
            aria-label={`Step ${step}${step === currentStep ? " (current)" : ""}`}
          />
        );
      })}
    </div>
  );
}
