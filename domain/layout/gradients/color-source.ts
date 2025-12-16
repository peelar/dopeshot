import type { ColorPalette } from "@/domain/asset/types";

/**
 * Identifies where gradient colors originated from.
 * - screenshot: Extracted from uploaded screenshot
 * - brand: From user's brand profile (future)
 * - manual: User-provided colors
 * - preset: From gradient presets
 */
export type ColorSourceType = "screenshot" | "brand" | "manual" | "preset";

/**
 * Detailed information about gradient color origin.
 * Replaces the simple GradientSource string type.
 */
export type ColorSourceInfo = {
  type: ColorSourceType;
  providerId?: string; // assetId for screenshot, brandId for brand
  originalColors?: ColorPalette; // Raw color inputs before enhancement
};

/**
 * Normalized color source with metadata.
 * Used to pass colors to gradient generation pipeline.
 */
export interface ColorSource {
  type: ColorSourceType;
  providerId?: string;
  colors: ColorPalette;
}

/**
 * Abstract interface for color extraction from different sources.
 * Future implementations: BrandColorProvider, ManualColorProvider
 */
export interface ColorProvider {
  extractColors(): Promise<ColorPalette>;
}

/**
 * Extracts colors from screenshot assets.
 * Wraps existing analyzeColors() function.
 */
export class ScreenshotColorProvider implements ColorProvider {
  constructor(private assetUrl: string) {}

  async extractColors(): Promise<ColorPalette> {
    const { analyzeColors } = await import("@/domain/asset/analyze-colors");
    const colors = await analyzeColors(this.assetUrl);

    if (!colors) {
      // Fallback to neutral colors if analysis fails
      return {
        dominant: "#64748b",
        accent: "#6366f1",
      };
    }

    return colors;
  }
}

/**
 * Helper to create a ColorSource from a screenshot asset.
 */
export function createScreenshotColorSource(
  assetId: string,
  colors: ColorPalette
): ColorSource {
  return {
    type: "screenshot",
    providerId: assetId,
    colors,
  };
}

/**
 * Helper to create ColorSourceInfo for BackgroundConfig.
 */
export function createColorSourceInfo(source: ColorSource): ColorSourceInfo {
  return {
    type: source.type,
    providerId: source.providerId,
    originalColors: source.colors,
  };
}

// Type guards and normalization utilities

/**
 * Type guard to check if gradientSource is detailed ColorSourceInfo.
 */
export function isColorSourceInfo(
  source: string | ColorSourceInfo | undefined
): source is ColorSourceInfo {
  return typeof source === "object" && "type" in source;
}

/**
 * Normalizes gradientSource to ColorSourceInfo format.
 * Handles both legacy strings and new objects.
 */
export function normalizeGradientSource(
  source: string | ColorSourceInfo | undefined
): ColorSourceInfo | undefined {
  if (!source) return undefined;

  if (isColorSourceInfo(source)) {
    return source;
  }

  // Convert legacy string to ColorSourceInfo
  return { type: source as ColorSourceType };
}

/**
 * Extracts the color source type from gradientSource.
 */
export function getColorSourceType(
  source: string | ColorSourceInfo | undefined
): ColorSourceType | undefined {
  const normalized = normalizeGradientSource(source);
  return normalized?.type;
}
