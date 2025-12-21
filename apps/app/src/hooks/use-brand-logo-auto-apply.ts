"use client";

import { useEffect, useRef } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { brandSettingsAtom, configAtom, assetsAtom } from "@/hooks/atoms";
import { useSession } from "@/lib/auth/auth-client";
import { supabaseDb } from "@/lib/supabase-db";
import type { Asset } from "@/domain/asset/types";

/**
 * Automatically loads and applies brand logo on mount if toggle is enabled.
 * This ensures the logo appears on screenshots immediately, not just when Brand panel opens.
 */
export function useBrandLogoAutoApply(options: { enabled: boolean } = { enabled: true }) {
  const { data: session } = useSession();
  const [brandSettings, setBrandSettings] = useAtom(brandSettingsAtom);
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const hasApplied = useRef(false);

  useEffect(() => {
    // Only run once, and only if feature is enabled, toggle is on, and logo not already applied
    if (!options.enabled || hasApplied.current || !brandSettings.useLogoOnScreenshots || config.assets?.logo || !session?.user) {
      return;
    }

    async function loadAndApplyLogo() {
      if (!session?.user) return;

      try {
        const { data, error } = await supabaseDb
          .from("brand_profiles")
          .select("logo_path")
          .eq("user_id", session.user.id)
          .single();

        if (error || !data?.logo_path) {
          return;
        }

        // Get signed URL
        const { data: signedUrlData, error: urlError } = await supabaseDb.storage
          .from("brand-logos")
          .createSignedUrl(data.logo_path, 3600);

        if (urlError || !signedUrlData?.signedUrl) {
          return;
        }

        // Update brand settings
        setBrandSettings((prev) => ({
          ...prev,
          logoUrl: signedUrlData.signedUrl,
          logoPath: data.logo_path,
        }));

        // Apply logo to screenshot
        const brandLogoAsset: Asset = {
          id: `brand-logo-${Date.now()}`,
          projectId: "brand",
          userId: "brand",
          url: signedUrlData.signedUrl,
          name: data.logo_path.split("/").pop() || "brand-logo",
          kind: "logo",
          createdAt: new Date().toISOString(),
        };

        setAssets((prevAssets) => [...prevAssets, brandLogoAsset]);
        setConfig((currentConfig) => ({
          ...currentConfig,
          assets: {
            ...currentConfig.assets,
            logo: brandLogoAsset.id,
          },
        }));

        hasApplied.current = true;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to auto-apply brand logo:", error);
        }
      }
    }

    loadAndApplyLogo();
  }, [session?.user?.id, brandSettings.useLogoOnScreenshots, config.assets?.logo]);
}
