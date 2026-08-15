"use client";

import { useEffect, useState, useRef } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import type { Asset } from "@/domain/asset/types";
import { getLayoutFormat } from "@/domain/layout-def/definitions";

export function useBrandLogoAutoApply() {
  const [brandSettings] = useAtom(brandSettingsAtom);
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const assets = useAtomValue(assetsAtom);
  const setAssets = useSetAtom(assetsAtom);
  const [error, setError] = useState<string | null>(null);
  const hasAppliedRef = useRef(false);
  const currentFormat = getLayoutFormat(config.layoutId);
  const canAutoApplyInCurrentFormat =
    currentFormat === "testimonial" || Boolean(config.assets?.screenshot);

  useEffect(() => {
    if (!config.assets?.logo) {
      hasAppliedRef.current = false;
    }
  }, [config.assets?.logo]);

  useEffect(() => {
    if (
      hasAppliedRef.current ||
      !brandSettings.useLogoOnScreenshots ||
      !canAutoApplyInCurrentFormat ||
      config.assets?.logo ||
      !brandSettings.logoUrl
    ) {
      return;
    }

    hasAppliedRef.current = true;
    try {
      const existingBrandLogo = assets.find(
        (asset) => asset.kind === "logo" && asset.url === brandSettings.logoUrl,
      );

      const brandLogoAsset: Asset = existingBrandLogo ?? {
        id: `brand-logo-${Date.now()}`,
        projectId: "brand",
        userId: "brand",
        url: brandSettings.logoUrl,
        name: brandSettings.logoPath?.split("/").pop() || "brand-logo",
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
    } catch (applyError) {
      const errorMessage = applyError instanceof Error ? applyError.message : "Failed to load logo";
      setError(errorMessage);
    }
  }, [
    assets,
    brandSettings.logoPath,
    brandSettings.logoUrl,
    brandSettings.useLogoOnScreenshots,
    canAutoApplyInCurrentFormat,
    config.assets?.logo,
    config.assets?.screenshot,
    config.layoutId,
    setAssets,
    setConfig,
  ]);

  return { error };
}
