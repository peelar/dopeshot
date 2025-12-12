"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useState, useCallback } from "react";
import { track } from "@/lib/analytics";
import { configAtom } from "@/hooks/atoms";
import { backgroundAssetAtom } from "@/hooks/atoms/derived";
import { GradientPicker } from "@/components/gradient-picker";
import { AIBackgroundGenerator } from "@/components/ai-background-generator";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import { AssetDropzone } from "@/components/layout-config";

interface BackgroundSectionProps {
  onUploadAsset?: (file: File, kind: "background") => void;
}

export function BackgroundSection({ onUploadAsset }: BackgroundSectionProps) {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const backgroundAsset = useAtomValue(backgroundAssetAtom);

  // Local state for background tab selection
  const [bgType, setBgType] = useState<"gradient" | "image" | "ai">(
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

  return (
    <div className="flex flex-col gap-4 pt-2">
      <SegmentedControl
        value={bgType}
        onChange={(value) => {
          const newType = value === "image" ? "image" : value === "ai" ? "ai" : "gradient";
          track("background_type_changed", {
            type: newType,
          });
          setBgType(newType);
        }}
        options={[
          { id: "gradient", label: "Gradient" },
          { id: "image", label: "Image" },
          { id: "ai", label: "AI ✨" },
        ]}
        ariaLabel="Background type"
      />

      {bgType === "gradient" && <GradientPicker onChangeAction={handleGradientChange} />}

      {bgType === "image" && (
        <div className="flex flex-col gap-3">
          <AssetDropzone
            asset={backgroundAsset}
            onUpload={(file) => onUploadAsset?.(file, "background")}
            onRemove={handleRemoveBackground}
            disabled={!onUploadAsset}
            label="Upload Background"
          />
        </div>
      )}

      {bgType === "ai" && <AIBackgroundGenerator />}
    </div>
  );
}
