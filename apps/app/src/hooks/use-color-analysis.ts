import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  assetsAtom,
  configAtom,
  gradientOptionsAtom,
  isAnalyzingColorsAtom,
  screenshotGradientAtom,
} from "@/hooks/atoms";
import { extractColorSignatureFromImage } from "@/domain/asset/color-analysis";
import { generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import { getGradientColorsForContrast } from "@/domain/layout/gradient-application";
import type { BackgroundConfig } from "@/domain/layout/types";

export function useColorAnalysis() {
  const setAssets = useSetAtom(assetsAtom);
  const setConfig = useSetAtom(configAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setGradientOptions = useSetAtom(gradientOptionsAtom);
  const setIsAnalyzingColors = useSetAtom(isAnalyzingColorsAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);

  const processColorAnalysis = useCallback(
    async (dataUrl: string, assetId: string, _autoLayoutMessage: string | null) => {
      setIsAnalyzingColors(true);
      setGradientOptions([]);

      try {
        const analysis = await extractColorSignatureFromImage(dataUrl);
        if (!analysis) return;

        const { palette, signature } = analysis;
        setAssets((prev) =>
          prev.map((asset) =>
            asset.id === assetId ? { ...asset, colorPalette: palette } : asset,
          ),
        );

        const gradients = generateGradientOptions(signature);
        setGradientOptions(gradients);

        const firstGradient = gradients[0];
        if (!firstGradient) return;

        const textColor = getContrastTextColor(getGradientColorsForContrast(firstGradient));

        setConfig((currentConfig) => {
          if (currentConfig.background?.type === "image") {
            return currentConfig;
          }
          if (currentConfig.background?.customGradient) {
            return currentConfig;
          }

          const currentBackground =
            currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
          const grainEnabled = currentBackground.grainEnabled ?? true;

          const nextBackground: BackgroundConfig = {
            ...currentBackground,
            type: "gradient",
            value: "custom",
            customGradient: firstGradient,
            grainEnabled,
          };

          setScreenshotGradient(nextBackground);

          return {
            ...currentConfig,
            background: nextBackground,
            colors: {
              ...currentConfig.colors,
              text: textColor,
            },
          };
        });
      } finally {
        setIsAnalyzingColors(false);
      }
    },
    [setAssets, setConfig, setGradientOptions, setIsAnalyzingColors, setScreenshotGradient],
  );

  return {
    processColorAnalysis,
    isAnalyzingColors,
  };
}
