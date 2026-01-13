import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { ColorPalette } from "@/domain/asset/types";
import { analyzeColors as analyzeImageColors } from "@/domain/asset/analyze-colors";
import { createScreenshotColorSource } from "@/domain/layout/gradients/color-source";
import { supportsScreenshots } from "@/domain/layout-def/definitions";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { configAtom, assetsAtom, statusMessageAtom, isAnalyzingColorsAtom } from "./atoms";
import { useGradientGeneration } from "./use-gradient-generation";

export interface UseColorAnalysisOptions {
  gradientPreferences: GradientPreferences;
}

export function useColorAnalysis({ gradientPreferences }: UseColorAnalysisOptions) {
  const [isAnalyzingColors, setIsAnalyzingColors] = useAtom(isAnalyzingColorsAtom);
  const [config] = useAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  // Use new gradient generation hook
  const { generateFromColorSource } = useGradientGeneration({ gradientPreferences });

  const analyzeColors = useCallback(async (dataUrl: string): Promise<ColorPalette | undefined> => {
    return analyzeImageColors(dataUrl);
  }, []);

  const processColorAnalysis = useCallback(
    async (dataUrl: string, assetId: string, autoLayoutMessage: string | null) => {
      // EARLY RETURN: Skip color analysis for looks that don't support screenshots
      if (!supportsScreenshots(config.layoutId)) {
        return;
      }

      setIsAnalyzingColors(true);
      setStatusMessage("Analyzing colors from screenshot...");

      try {
        const colorPalette = await analyzeColors(dataUrl);

        if (colorPalette) {
          // Store color palette in asset
          setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, colorPalette } : a)));

          // Create color source and generate gradients
          const colorSource = createScreenshotColorSource(assetId, colorPalette);
          await generateFromColorSource(colorSource, { autoLayoutMessage });
        }
      } catch (error) {
        // Silent fallback: log error but don't show to user
        if (process.env.NODE_ENV === "development") {
          console.error("Color analysis failed:", error);
        }

        // Continue without color analysis - defaults will be used
      } finally {
        setIsAnalyzingColors(false);
      }
    },
    [
      analyzeColors,
      config.layoutId,
      setAssets,
      setStatusMessage,
      setIsAnalyzingColors,
      generateFromColorSource,
    ],
  );

  return {
    processColorAnalysis,
    isAnalyzingColors,
  };
}
