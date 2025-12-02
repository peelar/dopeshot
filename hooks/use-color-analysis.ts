import { useCallback, useState } from "react";
import { ColorPalette } from "@/domain/asset/types";
import { Asset } from "@/domain/asset/types";
import { LayoutConfig } from "@/domain/layout/types";
import { analyzeColors as analyzeImageColors } from "@/domain/asset/analyze-colors";
import { generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import {
  applyPreferredAngle,
  getGradientColorsForContrast,
} from "@/domain/layout/gradient-application";
import type { GradientPreferences } from "@/domain/gradient-generation";

export interface UseColorAnalysisOptions {
  onAssetUpdate: (updater: (assets: Asset[]) => Asset[]) => void;
  onConfigUpdate: (updater: (config: LayoutConfig) => LayoutConfig) => void;
  onStatusMessage: (message: string) => void;
  gradientPreferences: GradientPreferences;
}

export function useColorAnalysis({
  onAssetUpdate,
  onConfigUpdate,
  onStatusMessage,
  gradientPreferences,
}: UseColorAnalysisOptions) {
  const [isAnalyzingColors, setIsAnalyzingColors] = useState(false);

  const analyzeColors = useCallback(async (dataUrl: string): Promise<ColorPalette | undefined> => {
    return analyzeImageColors(dataUrl);
  }, []);

  const processColorAnalysis = useCallback(
    async (dataUrl: string, assetId: string, autoLayoutMessage: string | null) => {
      setIsAnalyzingColors(true);
      onStatusMessage("Analyzing colors from screenshot...");

      try {
        const colorPalette = await analyzeColors(dataUrl);

        if (colorPalette) {
          onAssetUpdate((prev) => prev.map((a) => (a.id === assetId ? { ...a, colorPalette } : a)));
        }

        const gradientOptions = colorPalette
          ? generateGradientOptions(colorPalette, {
              aspectCategory: "landscape",
              templateVariant: undefined,
            })
          : [];

        const preferredGradient = gradientOptions[0];
        const fallbackGradient = preferredGradient
          ? applyPreferredAngle(preferredGradient, gradientPreferences.angle)
          : undefined;

        if (fallbackGradient) {
          const textColor = getContrastTextColor(getGradientColorsForContrast(fallbackGradient));

          onConfigUpdate((currentConfig) => ({
            ...currentConfig,
            colors: {
              ...currentConfig.colors,
              text: textColor,
            },
            background: {
              type: "gradient",
              value: "custom",
              customGradient: fallbackGradient,
              grainEnabled: currentConfig.background?.grainEnabled ?? true,
            },
          }));

          const gradientMessage = autoLayoutMessage
            ? `${autoLayoutMessage} Gradient applied based on your screenshot colors.`
            : "Gradient applied based on your screenshot colors.";
          onStatusMessage(gradientMessage);
        }
      } finally {
        setIsAnalyzingColors(false);
      }
    },
    [analyzeColors, onAssetUpdate, onConfigUpdate, onStatusMessage, gradientPreferences],
  );

  return {
    processColorAnalysis,
    isAnalyzingColors,
  };
}
