import { useCallback } from "react";
import { useSetAtom } from "jotai";
import { configAtom, screenshotGradientAtom, statusMessageAtom } from "./atoms";
import { generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import { applyPreferredAngle, getGradientColorsForContrast } from "@/domain/layout/gradient-application";
import type { ColorSource } from "@/domain/layout/gradients/color-source";
import { createColorSourceInfo } from "@/domain/layout/gradients/color-source";
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
   * Generates gradients from any color source and applies to config.
   * Respects user's manual background choices.
   */
  const generateFromColorSource = useCallback(
    async (source: ColorSource, options?: { autoLayoutMessage?: string | null }) => {
      const { autoLayoutMessage } = options ?? {};

      // Track color source analytics
      track("gradient_generated", {
        colorSourceType: source.type,
        hasProviderId: !!source.providerId,
      });

      // Generate 4 gradient options from color palette
      const gradientOptions = generateGradientOptions(source.colors, {
        aspectCategory: "landscape",
        variant: undefined,
      });

      if (gradientOptions.length === 0) {
        console.warn("No gradient options generated from color source", source);
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
        const userSelectedPreset =
          currentConfig.background?.type === "gradient" &&
          currentConfig.background.customGradient === undefined &&
          currentConfig.background.value !== "custom";
        const userHasCustomGradient = currentConfig.background?.customGradient !== undefined;
        const hasImageBackground = currentConfig.background?.type === "image";

        if (userSelectedPreset || userHasCustomGradient || hasImageBackground) {
          return currentConfig;
        }

        appliedGradient = true;

        // Create detailed gradient source info
        const sourceInfo = createColorSourceInfo(source);

        const generatedBackground = {
          ...(currentConfig.background ?? { type: "gradient", value: "custom" }),
          type: "gradient" as const,
          value: "custom",
          customGradient: finalGradient,
          gradientSource: sourceInfo, // 🎯 Detailed tracking
          grainEnabled: currentConfig.background?.grainEnabled ?? true,
          patternId: currentConfig.background?.patternId,
          patternMode: currentConfig.background?.patternMode,
        };

        // Store screenshot gradient separately for layout persistence
        if (source.type === "screenshot") {
          setScreenshotGradient(generatedBackground);
        }

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
          ? `${autoLayoutMessage} Gradient applied based on your ${source.type} colors.`
          : `Gradient applied based on your ${source.type} colors.`;
        setStatusMessage(gradientMessage);
      }
    },
    [setConfig, setScreenshotGradient, setStatusMessage, gradientPreferences]
  );

  return {
    generateFromColorSource,
  };
}
