"use client";

import { useEffect, useState, useRef } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import { loadedMemoryItemIdAtom } from "@/hooks/atoms/memory";
import { useSession } from "@/lib/auth/auth-client";
import type { Asset } from "@/domain/asset/types";

/**
 * Automatically loads and applies brand logo for NEW designs (not loaded from memory).
 * For designs loaded from memory, brand logo is applied during the load process in useMemory.
 */
export function useBrandLogoAutoApply(options: { enabled: boolean } = { enabled: true }) {
  const { data: session } = useSession();
  const [brandSettings, setBrandSettings] = useAtom(brandSettingsAtom);
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const assets = useAtomValue(assetsAtom);
  const setAssets = useSetAtom(assetsAtom);
  const loadedItemId = useAtomValue(loadedMemoryItemIdAtom);
  const [error, setError] = useState<string | null>(null);
  const hasAppliedRef = useRef(false);

  useEffect(() => {
    if (!config.assets?.logo && !loadedItemId) {
      hasAppliedRef.current = false;
    }
  }, [config.assets?.logo, loadedItemId]);

  useEffect(() => {
    // Skip if:
    // - Feature is disabled
    // - Already applied this session
    // - Toggle is off
    // - Screenshot not uploaded yet
    // - Logo already exists
    // - User not logged in
    // - Design was loaded from memory (brand logo handled in useMemory)
    if (
      !options.enabled ||
      hasAppliedRef.current ||
      !brandSettings.useLogoOnScreenshots ||
      !config.assets?.screenshot ||
      config.assets?.logo ||
      !session?.user ||
      loadedItemId // Skip for loaded designs - handled in useMemory
    ) {
      return;
    }

    async function loadAndApplyLogo() {
      if (!session?.user) return;
      hasAppliedRef.current = true;

      try {
        // Fetch brand profile from API
        const response = await fetch("/api/brand/profile", {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();

        if (!payload?.logoUrl || !payload?.profile?.logoPath) {
          return;
        }

        // Update brand settings with fetched data
        setBrandSettings((prev) => ({
          ...prev,
          logoUrl: payload.logoUrl,
          logoPath: payload.profile.logoPath,
        }));

        const existingBrandLogo = assets.find(
          (asset) => asset.kind === "logo" && asset.url === payload.logoUrl,
        );

        // Apply logo to screenshot
        const brandLogoAsset: Asset = existingBrandLogo ?? {
          id: `brand-logo-${Date.now()}`,
          projectId: "brand",
          userId: "brand",
          url: payload.logoUrl,
          name: payload.profile.logoPath.split("/").pop() || "brand-logo",
          kind: "logo",
          createdAt: new Date().toISOString(),
        };

        if (!existingBrandLogo) {
          setAssets((prevAssets) => [...prevAssets, brandLogoAsset]);
        }
        setConfig((currentConfig) => ({
          ...currentConfig,
          assets: {
            ...currentConfig.assets,
            logo: brandLogoAsset.id,
          },
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load logo";
        setError(errorMessage);

        if (process.env.NODE_ENV === "development") {
          console.error("Failed to auto-apply brand logo:", error);
        }
      }
    }

    loadAndApplyLogo();
  }, [
    assets,
    session?.user?.id,
    brandSettings.useLogoOnScreenshots,
    config.assets?.logo,
    options.enabled,
    loadedItemId,
    setBrandSettings,
    setAssets,
    setConfig,
  ]);

  return { error };
}
