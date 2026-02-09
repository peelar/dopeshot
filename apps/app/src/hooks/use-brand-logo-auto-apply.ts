"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import { loadedMemoryItemIdAtom } from "@/hooks/atoms/memory";
import { useSession } from "@/lib/auth/auth-client";
import type { Asset } from "@/domain/asset/types";
import { getLayoutFormat } from "@/domain/layout-def/definitions";

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
  const currentFormat = getLayoutFormat(config.layoutId);
  const canAutoApplyInCurrentFormat =
    currentFormat === "testimonial" || Boolean(config.assets?.screenshot);
  const prefetchPromiseRef = useRef<Promise<{ logoUrl: string; logoPath: string } | null> | null>(
    null,
  );

  const fetchBrandProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/brand/profile", {
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();

      if (!payload?.logoUrl || !payload?.profile?.logoPath) {
        return null;
      }

      const logoUrl = payload.logoUrl as string;
      const logoPath = payload.profile.logoPath as string;

      setBrandSettings((prev) => ({
        ...prev,
        logoUrl,
        logoPath,
      }));

      return { logoUrl, logoPath };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch brand logo:", error);
      }
      return null;
    }
  }, [setBrandSettings]);

  useEffect(() => {
    if (!config.assets?.logo && !loadedItemId) {
      hasAppliedRef.current = false;
    }
  }, [config.assets?.logo, loadedItemId]);

  // Prefetch brand profile as soon as possible so logo data is ready before uploads
  useEffect(() => {
    if (!options.enabled || !session?.user || !brandSettings.useLogoOnScreenshots) {
      return;
    }

    if ((brandSettings.logoUrl && brandSettings.logoPath) || prefetchPromiseRef.current) {
      return;
    }

    prefetchPromiseRef.current = fetchBrandProfile().finally(() => {
      prefetchPromiseRef.current = null;
    });
  }, [
    brandSettings.logoPath,
    brandSettings.logoUrl,
    brandSettings.useLogoOnScreenshots,
    fetchBrandProfile,
    options.enabled,
    session?.user,
  ]);

  useEffect(() => {
    // Skip if:
    // - Feature is disabled
    // - Already applied this session
    // - Toggle is off
    // - Current format is not ready (screenshot formats require an uploaded screenshot)
    // - Logo already exists
    // - User not logged in
    // - Design was loaded from memory (brand logo handled in useMemory)
    if (
      !options.enabled ||
      hasAppliedRef.current ||
      !brandSettings.useLogoOnScreenshots ||
      !canAutoApplyInCurrentFormat ||
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
        // Use cached logo if available; otherwise wait for the prefetch (or fetch once).
        let logoUrl = brandSettings.logoUrl;
        let logoPath = brandSettings.logoPath;

        if (!logoUrl || !logoPath) {
          const prefetchResult = await (prefetchPromiseRef.current ?? fetchBrandProfile());
          logoUrl = prefetchResult?.logoUrl ?? logoUrl;
          logoPath = prefetchResult?.logoPath ?? logoPath;
        }

        if (!logoUrl || !logoPath) {
          return;
        }

        const existingBrandLogo = assets.find(
          (asset) => asset.kind === "logo" && asset.url === logoUrl,
        );

        // Apply logo to the current canvas
        const brandLogoAsset: Asset = existingBrandLogo ?? {
          id: `brand-logo-${Date.now()}`,
          projectId: "brand",
          userId: "brand",
          url: logoUrl,
          name: logoPath.split("/").pop() || "brand-logo",
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
    canAutoApplyInCurrentFormat,
    config.assets?.logo,
    config.assets?.screenshot,
    config.layoutId,
    options.enabled,
    loadedItemId,
    setAssets,
    setConfig,
  ]);

  return { error };
}
