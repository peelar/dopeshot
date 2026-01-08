"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { configAtom, screenshotGradientAtom } from "@/hooks/atoms";
import { backgroundSelectionAtom } from "@/hooks/atoms/backgrounds";
import { GradientPicker } from "@/components/selectors/gradient-picker";
import { ShaderPicker, ShaderPickerInline } from "@/components/shaders";
import type { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import type { ShaderPreset } from "@/domain/shaders";
import { clearBackgroundSelection } from "@/domain/backgrounds/background-service";
import { track } from "@/lib/analytics";

interface BackgroundSectionProps {
  variant?: "default" | "inline";
}

export function BackgroundSection({ variant = "default" }: BackgroundSectionProps = {}) {
  const { data: session } = useSession();
  const setConfig = useSetAtom(configAtom);
  const config = useAtomValue(configAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const [selection, setSelection] = useAtom(backgroundSelectionAtom);

  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    if (!isAuthenticated) {
      setSelection(null);
    }
  }, [isAuthenticated, setSelection]);

  const handleGradientChange = useCallback(
    (background: BackgroundConfig, textColor: ColorToken) => {
      setConfig((currentConfig) => {
        const currentBackground =
          currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
        const grainEnabled = background.grainEnabled ?? currentBackground.grainEnabled ?? true;

        const newBackground = {
          ...currentBackground,
          ...background,
          grainEnabled,
          patternId: background.patternId ?? currentBackground.patternId,
          patternMode: background.patternMode ?? currentBackground.patternMode,
          // Clear shader config when switching to gradient
          shaderConfig: undefined,
        };

        // Store screenshot gradient for persistence across layout changes
        if (background.gradientSource === "screenshot") {
          setScreenshotGradient(newBackground);
        }

        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: newBackground,
        };
      });

      if (selection) {
        setSelection(null);
        void clearBackgroundSelection().catch(() => null);
      }
    },
    [selection, setConfig, setScreenshotGradient, setSelection],
  );

  const handleShaderSelect = useCallback(
    (preset: ShaderPreset) => {
      track("shader_background_applied", {
        preset_id: preset.id,
        shader_type: preset.config.type,
      });

      setConfig((currentConfig) => {
        // Determine text color based on shader colors
        const shaderColors = preset.config.params.colors ?? [];
        const textColor = getShaderTextColor(shaderColors);

        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: {
            type: "shader",
            value: preset.id,
            shaderConfig: preset.config,
            // Disable pattern overlay for shaders
            patternId: "none",
            patternMode: "manual",
          },
        };
      });

      if (selection) {
        setSelection(null);
        void clearBackgroundSelection().catch(() => null);
      }
    },
    [selection, setConfig, setSelection],
  );

  const selectedShaderPresetId =
    config.background?.type === "shader" ? config.background.value : undefined;

  if (variant === "inline") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <GradientPicker onChangeAction={handleGradientChange} variant="inline" />
          <ShaderPickerInline
            selectedPresetId={selectedShaderPresetId}
            onSelectPreset={handleShaderSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Gradients Section */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          From Screenshot
        </span>
        <GradientPicker onChangeAction={handleGradientChange} />
      </div>

      {/* Shaders Section */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Dynamic Shaders
        </span>
        <ShaderPicker
          selectedPresetId={selectedShaderPresetId}
          onSelectPreset={handleShaderSelect}
        />
      </div>
    </div>
  );
}

/**
 * Determine appropriate text color based on shader background colors
 */
function getShaderTextColor(colors: string[]): ColorToken {
  if (colors.length === 0) return "slate-50";

  // Calculate average luminance of shader colors
  const avgLuminance = colors.reduce((sum, color) => {
    const luminance = getColorLuminance(color);
    return sum + luminance;
  }, 0) / colors.length;

  // Use light text for dark backgrounds, dark text for light backgrounds
  return avgLuminance < 0.5 ? "slate-50" : "slate-900";
}

/**
 * Calculate relative luminance of a color
 */
function getColorLuminance(hex: string): number {
  // Remove # if present
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  // Calculate relative luminance
  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
