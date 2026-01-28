"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth/auth-client";

export type UserTier = "free" | "brand";

type UserTierResponse = {
  tier: UserTier;
};

const tierCache = new Map<string, UserTier>();
const inFlight = new Map<string, Promise<UserTier>>();

async function fetchUserTier(): Promise<UserTier> {
  const response = await fetch("/api/user/tier", { method: "GET", cache: "no-store" });
  if (!response.ok) return "free";
  const data = (await response.json()) as Partial<UserTierResponse>;
  return data.tier === "brand" ? "brand" : "free";
}

/**
 * Invalidate the tier cache for a specific user or all users.
 * Useful after tier upgrades/downgrades.
 */
export function invalidateTierCache(userId?: string) {
  if (userId) {
    tierCache.delete(userId);
  } else {
    tierCache.clear();
  }
}

export function useUserTier() {
  const { data: session, isPending } = useSession();
  const userId = session?.session?.userId ?? null;

  const [tier, setTier] = useState<UserTier>("free");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isPending) {
      setIsLoading(true);
      return;
    }

    if (!userId) {
      setTier("free");
      setIsLoading(false);
      return;
    }

    const currentUserId = userId;

    async function loadTier() {
      try {
        setIsLoading(true);
        const cached = tierCache.get(currentUserId);
        if (cached) {
          setTier(cached);
          return;
        }

        const request = inFlight.get(currentUserId) ?? fetchUserTier();
        inFlight.set(currentUserId, request);

        const resolvedTier = await request;
        tierCache.set(currentUserId, resolvedTier);
        setTier(resolvedTier);
      } catch {
        setTier("free");
      } finally {
        inFlight.delete(currentUserId);
        setIsLoading(false);
      }
    }

    void loadTier();
  }, [isPending, userId]);

  const isBrandUser = useMemo(() => tier === "brand", [tier]);

  return { tier, isLoading, isBrandUser };
}
