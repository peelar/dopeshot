/**
 * Gradient Generation Service
 * 
 * Intelligence layer for color extraction and gradient creation from images.
 * 
 * Purpose: Analyze images and generate aesthetically pleasing gradients
 * Layer: Domain Service (business logic)
 * Dependencies: 
 *   - Uses gradient types from domain/layout/gradients (for output format)
 *   - Does NOT import from domain/layout/gradients currently (good)
 * 
 * Used by: UI components and hooks for dynamic gradient generation
 */

import { extractPaletteFromImage, type ColorExtractionResult } from "./color-extraction";
import { normalizeImageBuffer, isLikelyImageBuffer } from "./utils";
import { analyzePaletteMood, determineStrategy, type PaletteMood } from "./strategy";
import { buildGradientFromPalette, refineGradientColors } from "./gradient-builder";
import type { GradientStrategy } from "./strategy";

export type { GradientStrategy } from "./strategy";
export type { PaletteMood } from "./strategy";

export interface GradientPreferences {
  angle?: number;
  temperature?: "warm" | "cool" | "neutral";
  intensity?: "soft" | "balanced" | "bold";
}

export interface GradientResult {
  angle: number;
  colorStart: string;
  colorEnd: string;
  debugInfo?: {
    extractedColors?: string[];
    strategy?: GradientStrategy;
    paletteStats?: {
      accentCount: number;
      baseCount: number;
      clusterCount: number;
    };
    mood?: PaletteMood;
    appliedPreferences?: GradientPreferences;
  };
}

export interface GenerateGradientOptions {
  maxSize?: number;
  debug?: boolean;
  preferences?: GradientPreferences;
}

export type { SupportedImageBuffer } from "./utils";

const DEFAULT_ANGLE = 135;
const FALLBACK_START = "#667eea";
const FALLBACK_END = "#764ba2";

export async function generateGradientFromImage(
  imageBuffer: Parameters<typeof normalizeImageBuffer>[0],
  options?: GenerateGradientOptions,
): Promise<GradientResult> {
  const normalizedBuffer = normalizeImageBuffer(imageBuffer);
  const byteLength = normalizedBuffer.byteLength;

  console.info(`[gradient-generator] Received image buffer with ${byteLength} bytes.`);

  if (!isLikelyImageBuffer(normalizedBuffer)) {
    console.warn(
      "[gradient-generator] Provided buffer does not appear to be a PNG/JPEG/GIF. Proceeding with cautious gradient extraction.",
    );
  }

  try {
    const palette = await extractPaletteFromImage(normalizedBuffer, {
      maxSize: options?.maxSize,
      debug: options?.debug,
    });
    const mood = analyzePaletteMood(palette);
    const strategy = determineStrategy(palette, mood);
    const baseColors = buildGradientFromPalette(palette, strategy, mood, options?.preferences);
    const { colorStart, colorEnd } = refineGradientColors(baseColors, options?.preferences, mood);

    const gradient: GradientResult = {
      angle: options?.preferences?.angle ?? DEFAULT_ANGLE,
      colorStart,
      colorEnd,
    };

    if (options?.debug) {
      gradient.debugInfo = {
        extractedColors: palette.colors.map((color) => color.hex),
        strategy,
        paletteStats: {
          accentCount: palette.accentColors.length,
          baseCount: palette.baseColors.length,
          clusterCount: palette.stats.clusterCount,
        },
        mood,
        appliedPreferences: options.preferences,
      };
    }

    return gradient;
  } catch (error) {
    console.error("[gradient-generator] Failed to build gradient, falling back to default", error);
    return {
      angle: DEFAULT_ANGLE,
      colorStart: FALLBACK_START,
      colorEnd: FALLBACK_END,
      debugInfo: options?.debug
        ? {
            strategy: "fallback",
            extractedColors: [FALLBACK_START, FALLBACK_END],
            appliedPreferences: options?.preferences,
          }
        : undefined,
    };
  }
}
