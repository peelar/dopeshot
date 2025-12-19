"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useState, useCallback } from "react";
import { configAtom, assetsAtom } from "@/hooks/atoms";
import { backgroundAssetAtom } from "@/hooks/atoms/derived";
import { GradientPicker } from "@/components/selectors/gradient-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
import { AssetDropzone } from "@/components/config/layout-config";
import { useBackgrounds } from "@/hooks/use-backgrounds";
import { PresetBackgroundGrid } from "@/components/selectors/preset-background-grid";
import { BrandBackgroundGrid } from "@/components/selectors/brand-background-grid";
import type { PresetBackground, BrandBackground } from "@/domain/backgrounds/types";
import { track } from "@/lib/analytics";
import { useSession } from "@/lib/auth/auth-client";

interface BackgroundSectionProps {
  onUploadAsset?: (file: File, kind: "background") => void;
}

export function BackgroundSection({ onUploadAsset }: BackgroundSectionProps) {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const backgroundAsset = useAtomValue(backgroundAssetAtom);
  const { data: session } = useSession();

  const { presets, brandBackgrounds, isLoadingPresets, isLoadingBrand } = useBackgrounds();

  // Local state for background tab selection
  const [bgType, setBgType] = useState<"gradient" | "image">(
    config.background?.type === "image" ? "image" : "gradient",
  );

  const handleGradientChange = useCallback(
    (background: BackgroundConfig, textColor: ColorToken) => {
      setConfig((currentConfig) => {
        const currentBackground =
          currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
        const grainEnabled = background.grainEnabled ?? currentBackground.grainEnabled ?? true;
        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: {
            ...currentBackground,
            ...background,
            grainEnabled,
            patternId: background.patternId ?? currentBackground.patternId,
            patternMode: background.patternMode ?? currentBackground.patternMode,
          },
        };
      });
    },
    [setConfig],
  );

  const handleRemoveBackground = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      assets: {
        ...currentConfig.assets,
        background: undefined,
      },
    }));
  }, [setConfig]);

  const handlePresetSelect = useCallback(
    (preset: PresetBackground) => {
      const backgroundAsset: Asset = {
        id: `preset-bg-${preset.id}`,
        projectId: "preset",
        userId: "preset",
        url: preset.url,
        name: preset.name,
        kind: "background",
        createdAt: preset.createdAt,
      };

      setAssets((prev) => [...prev, backgroundAsset]);
      setConfig((currentConfig) => ({
        ...currentConfig,
        background: {
          type: "image",
          value: backgroundAsset.id,
        },
        assets: {
          ...currentConfig.assets,
          background: backgroundAsset.id,
        },
      }));

      track("preset_background_selected", {
        preset_id: preset.id,
        preset_name: preset.name,
      });
    },
    [setAssets, setConfig]
  );

  const handleBrandBackgroundSelect = useCallback(
    (background: BrandBackground) => {
      const backgroundAsset: Asset = {
        id: `brand-bg-${background.id}`,
        projectId: "brand",
        userId: "brand",
        url: background.url,
        name: background.name || "Brand background",
        kind: "background",
        createdAt: background.createdAt,
      };

      setAssets((prev) => [...prev, backgroundAsset]);
      setConfig((currentConfig) => ({
        ...currentConfig,
        background: {
          type: "image",
          value: backgroundAsset.id,
        },
        assets: {
          ...currentConfig.assets,
          background: backgroundAsset.id,
        },
      }));

      track("brand_background_selected_from_design_tab", {
        background_id: background.id,
      });
    },
    [setAssets, setConfig]
  );

  // Get current selected background URL
  const currentBackgroundUrl = backgroundAsset?.url;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <SegmentedControl
        value={bgType}
        onChange={(value) => {
          if (value === "image") setBgType("image");
          else setBgType("gradient");
        }}
        options={[
          { id: "gradient", label: "Gradient" },
          { id: "image", label: "Image" },
        ]}
        ariaLabel="Background type"
      />

      {bgType === "gradient" && <GradientPicker onChangeAction={handleGradientChange} />}

      {bgType === "image" && (
        <div className="flex flex-col gap-4">
          {/* Upload Section */}
          <AssetDropzone
            asset={backgroundAsset}
            onUpload={(file) => onUploadAsset?.(file, "background")}
            onRemove={handleRemoveBackground}
            disabled={!onUploadAsset}
            label="Upload Background"
          />

          {/* Brand Backgrounds Section (for logged-in users) */}
          {session?.user && brandBackgrounds.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Backgrounds
                </h4>
              </div>
              <BrandBackgroundGrid
                backgrounds={brandBackgrounds}
                selectedUrl={currentBackgroundUrl}
                onSelect={handleBrandBackgroundSelect}
                isLoading={isLoadingBrand}
                showRemove={false}
              />
            </div>
          )}

          {/* Preset Backgrounds Section */}
          {presets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preset Backgrounds
                </h4>
              </div>
              <PresetBackgroundGrid
                backgrounds={presets}
                selectedUrl={currentBackgroundUrl}
                onSelect={handlePresetSelect}
                isLoading={isLoadingPresets}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
