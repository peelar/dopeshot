"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSession } from "@/lib/auth/auth-client";

type OnboardingStatusPayload = {
  tier: "free" | "brand";
  onboardingComplete: boolean;
};

export function useOnboardingStatus(options?: { enabled?: boolean }) {
  const { data: session, isPending } = useSession();
  const enabled = options?.enabled ?? true;

  const [status, setStatus] = useState<OnboardingStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/brand/onboarding-status", {
        method: "GET",
        credentials: "include",
      });

      const payload = (await response.json()) as Partial<OnboardingStatusPayload> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load onboarding status");
      }

      if (payload?.tier !== "free" && payload?.tier !== "brand") {
        throw new Error("Invalid onboarding status response");
      }

      setStatus({
        tier: payload.tier,
        onboardingComplete: Boolean(payload.onboardingComplete),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load onboarding status";
      setError(message);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, session?.user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const derived = useMemo(() => {
    const tier = status?.tier ?? "free";
    const isBrand = tier === "brand";
    const onboardingComplete = Boolean(status?.onboardingComplete);
    return {
      tier,
      isBrand,
      onboardingComplete,
      shouldRedirectToOnboarding: isBrand && !onboardingComplete,
    };
  }, [status?.onboardingComplete, status?.tier]);

  return {
    ...derived,
    isLoading: isPending || isLoading,
    error,
    refresh,
  };
}

