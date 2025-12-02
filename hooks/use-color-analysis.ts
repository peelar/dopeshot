import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { ColorPalette } from "@/domain/asset/types";
import { analyzeColors as analyzeImageColors } from "@/domain/asset/analyze-colors";
import { generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import {
  applyPreferredAngle,
  getGradientColorsForContrast,
} from "@/domain/layout/gradient-application";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { configAtom, assetsAtom, statusMessageAtom, isAnalyzingColorsAtom } from "./atoms";

export interface UseColorAnalysisOptions {
  gradientPreferences: GradientPreferences;
}

export function useColorAnalysis({ gradientPreferences }: UseColorAnalysisOptions) {
  const [isAnalyzingColors, setIsAnalyzingColors] = useAtom(isAnalyzingColorsAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setConfig = useSetAtom(configAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  const analyzeColors = useCallback(async (dataUrl: string): Promise<ColorPalette | undefined> => {
    return analyzeImageColors(dataUrl);
  }, []);

  const processColorAnalysis = useCallback(
    async (dataUrl: string, assetId: string, autoLayoutMessage: string | null) => {
      setIsAnalyzingColors(true);
      setStatusMessage("Analyzing colors from screenshot...");

      try {
        const colorPalette = await analyzeColors(dataUrl);

        if (colorPalette) {
          setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, colorPalette } : a)));
        }

        const gradientOptions = colorPalette
          ? generateGradientOptions(colorPalette, {
              aspectCategory: "landscape",
              templateVariant: undefined,
            })
          : [];

        // Randomly select a gradient from the available options
        const randomIndex = Math.floor(Math.random() * gradientOptions.length);
        const preferredGradient = gradientOptions[randomIndex];
        const fallbackGradient = preferredGradient
          ? applyPreferredAngle(preferredGradient, gradientPreferences.angle)
          : undefined;

        if (fallbackGradient) {
          const textColor = getContrastTextColor(getGradientColorsForContrast(fallbackGradient));

          setConfig((currentConfig) => ({
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
          setStatusMessage(gradientMessage);
        }
      } finally {
        setIsAnalyzingColors(false);
      }
    },
    [
      analyzeColors,
      setAssets,
      setConfig,
      setStatusMessage,
      setIsAnalyzingColors,
      gradientPreferences,
    ],
  );

  return {
    processColorAnalysis,
    isAnalyzingColors,
  };
}
