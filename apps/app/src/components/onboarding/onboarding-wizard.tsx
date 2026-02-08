"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { track } from "@/lib/analytics";
import { toast } from "@/lib/utils/toast";
import { invalidateTierCache } from "@/hooks/use-user-tier";
import type { BrandMode, BrandPersonality } from "@/lib/types/brand";
import { StepIndicator } from "./step-indicator";
import { BrandSetupStep } from "./brand-setup-step";
import { BackgroundCollectionStep } from "./background-collection-step";

export type OnboardingWizardProps = {
  initialLogoUrl?: string | null;
  initialLogoPath?: string | null;
  initialAccent?: string | null;
  initialMode?: BrandMode | null;
  initialPersonality?: BrandPersonality | null;
  onCompleted?: () => void;
  onDismiss?: () => void;
};

export function OnboardingWizard({
  initialLogoUrl,
  initialLogoPath,
  initialAccent,
  initialMode,
  initialPersonality,
  onCompleted,
  onDismiss,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [savedPersonality, setSavedPersonality] = useState<BrandPersonality | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Step 1 state for passing back if user returns
  const [step1Data, setStep1Data] = useState<{
    logoUrl: string | null;
    logoPath: string | null;
    accent: string;
    mode: BrandMode;
    personality: BrandPersonality;
  } | null>(null);

  const handleStep1Next = useCallback(
    async (data: {
      logoUrl: string | null;
      logoPath: string | null;
      accent: string;
      mode: BrandMode;
      personality: BrandPersonality;
    }) => {
      setIsTransitioning(true);
      setStep1Data(data);

      try {
        // Persist brand data immediately (onboarding_completed: false)
        const response = await fetch("/api/brand/update-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logo_path: data.logoPath,
            personality: data.personality,
            accent: data.accent,
            mode: data.mode,
            onboarding_completed: false,
          }),
          credentials: "include",
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to save brand settings");
        }

        track("onboarding_step1_completed", {
          mode: data.mode,
          personality: data.personality,
          has_logo: Boolean(data.logoPath),
        });

        setSavedPersonality(data.personality);
        setCurrentStep(2);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save brand settings";
        toast.error(message);
        onDismiss?.();
      } finally {
        setIsTransitioning(false);
      }
    },
    [onDismiss],
  );

  const completeOnboarding = useCallback(async () => {
    setIsTransitioning(true);

    try {
      const response = await fetch("/api/brand/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: true }),
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to complete onboarding");
      }

      if (step1Data) {
        track("brand_onboarding_completed", {
          mode: step1Data.mode,
          personality: step1Data.personality,
          has_logo: Boolean(step1Data.logoPath),
        });
      }

      invalidateTierCache();
      router.refresh();
      onCompleted?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete onboarding";
      toast.error(message);
      onDismiss?.();
    } finally {
      setIsTransitioning(false);
    }
  }, [step1Data, router, onCompleted, onDismiss]);

  const handleStep2Done = useCallback(
    (backgroundsAdded: number) => {
      track("onboarding_step2_completed", { backgrounds_added: backgroundsAdded });
      void completeOnboarding();
    },
    [completeOnboarding],
  );

  const handleStep2Skip = useCallback(
    (backgroundsAdded: number) => {
      track("onboarding_step2_skipped", { backgrounds_added: backgroundsAdded });
      void completeOnboarding();
    },
    [completeOnboarding],
  );

  const stepTitle =
    currentStep === 1
      ? "Welcome to dopeshot"
      : "Build your background collection";

  const stepDescription =
    currentStep === 1
      ? "Quick setup so your next export looks unmistakably you."
      : "Optional — you can always add more later from the Brand tab.";

  return (
    <div>
      {/* Step header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">{stepTitle}</h2>
          <p className="text-xs text-muted-foreground">{stepDescription}</p>
        </div>
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Step content */}
      {currentStep === 1 ? (
        <BrandSetupStep
          initialLogoUrl={step1Data?.logoUrl ?? initialLogoUrl}
          initialLogoPath={step1Data?.logoPath ?? initialLogoPath}
          initialAccent={step1Data?.accent ?? initialAccent}
          initialMode={step1Data?.mode ?? initialMode}
          initialPersonality={step1Data?.personality ?? initialPersonality}
          isSubmitting={isTransitioning}
          onNext={handleStep1Next}
        />
      ) : savedPersonality ? (
        <BackgroundCollectionStep
          personality={savedPersonality}
          isSubmitting={isTransitioning}
          onDone={handleStep2Done}
          onSkip={handleStep2Skip}
        />
      ) : null}
    </div>
  );
}
