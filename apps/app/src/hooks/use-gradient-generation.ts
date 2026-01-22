import { useCallback } from "react";
import { useSetAtom } from "jotai";
import { configAtom, screenshotGradientAtom, statusMessageAtom } from "./atoms";
import { generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import { applyPreferredAngle, getGradientColorsForContrast } from "@/domain/layout/gradient-application";
import type { ColorPalette } from "@/domain/asset/types";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { track } from "@/lib/analytics";

export interface UseGradientGenerationOptions {
  gradientPreferences: GradientPreferences;
}

export function useGradientGeneration({ gradientPreferences }: UseGradientGenerationOptions) {
  const setConfig = useSetAtom(configAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);

  /**
   * Generates gradients from screenshot colors and applies to config.
   * Respects user's manual background choices.
   */
  const generateFromScreenshot = useCallback(
    async (colors: ColorPalette, options?: { autoLayoutMessage?: string | null }) => {
      const { autoLayoutMessage } = options ?? {};

      track("gradient_generated", {
        hasColors: !!colors,
      });

      // Generate gradient options from color palette
      const gradientOptions = generateGradientOptions(colors, {
        aspectCategory: "landscape",
        variant: undefined,
      });

      if (gradientOptions.length === 0) {
        console.warn("No gradient options generated from colors", colors);
        return;
      }

      // Always select the first gradient for consistent behavior
      const selectedGradient = gradientOptions[0];

      // Apply user's preferred angle
      const finalGradient = applyPreferredAngle(selectedGradient, gradientPreferences.angle);

      // Calculate contrast text color
      const textColor = getContrastTextColor(getGradientColorsForContrast(finalGradient));

      let appliedGradient = false;

      setConfig((currentConfig) => {
        // Respect any manual background choice made during generation
        const userHasCustomGradient = currentConfig.background?.customGradient !== undefined;
        const hasImageBackground = currentConfig.background?.type === "image";

        if (userHasCustomGradient || hasImageBackground) {
          return currentConfig;
        }

        appliedGradient = true;

        const generatedBackground = {
          ...(currentConfig.background ?? { type: "gradient", value: "custom" }),
          type: "gradient" as const,
          value: "custom",
          customGradient: finalGradient,
          grainEnabled: currentConfig.background?.grainEnabled ?? true,
          patternId: currentConfig.background?.patternId,
          patternMode: currentConfig.background?.patternMode,
        };

        // Store screenshot gradient separately for layout persistence
        setScreenshotGradient(generatedBackground);

        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: generatedBackground,
        };
      });

      if (appliedGradient) {
        const gradientMessage = autoLayoutMessage
          ? `${autoLayoutMessage} Gradient applied from screenshot colors.`
          : `Gradient applied from screenshot colors.`;
        setStatusMessage(gradientMessage);
      }
    },
    [setConfig, setScreenshotGradient, setStatusMessage, gradientPreferences]
  );

  return {
    generateFromScreenshot,
  };
}
