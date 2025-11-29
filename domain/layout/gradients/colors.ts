import { converter, formatHex, oklch, type Oklch } from "culori";
import { ColorPalette } from "@/domain/asset/types";

/**
 * Convert hex color to OKLCH color space
 */
export function hexToOklch(hex: string): Oklch | null {
  try {
    const convert = converter(oklch);
    const result = convert(hex);
    return result && typeof result === "object" && "l" in result ? (result as Oklch) : null;
  } catch {
    return null;
  }
}

/**
 * Convert OKLCH color to hex
 */
export function oklchToHex(color: Oklch): string {
  try {
    return formatHex(color);
  } catch {
    return "#000000";
  }
}

/**
 * Enhanced color palette with categorized colors for gradient generation
 */
export type EnhancedColorPalette = {
  hero: string; // Primary accent color - becomes the "hero" of the gradient
  base: string; // Base/background tone
  accent: string; // Secondary accent
  dominant: string; // Dominant color from screenshot
  vibrant?: string; // Vibrant variant
  muted?: string; // Muted variant
  isNeutral: boolean; // Whether palette is mostly grayscale
  isDark: boolean; // Whether palette is mostly dark
  saturation: number; // Average saturation (0-1)
};

/**
 * Enhance a color by adjusting saturation and lightness
 */
export function enhanceColor(
  hex: string,
  options: {
    saturationBoost?: number; // 0-1, increase saturation
    lightnessShift?: number; // -1 to 1, shift lightness
  } = {},
): string {
  const { saturationBoost = 0, lightnessShift = 0 } = options;
  const oklchColor = hexToOklch(hex);
  if (!oklchColor) return hex;

  let l = oklchColor.l ?? 0.5;
  let c = oklchColor.c ?? 0;
  const h = oklchColor.h ?? 0;

  // Boost saturation (chroma in OKLCH)
  if (saturationBoost > 0) {
    c = Math.min(0.4, c + saturationBoost * 0.3);
  }

  // Shift lightness
  if (lightnessShift !== 0) {
    l = Math.max(0.1, Math.min(0.9, l + lightnessShift * 0.3));
  }

  const enhanced: Oklch = {
    mode: "oklch",
    l,
    c,
    h,
  };

  return oklchToHex(enhanced);
}

/**
 * Calculate average saturation of a color palette
 */
function calculateAverageSaturation(palette: ColorPalette): number {
  const colors = [palette.dominant, palette.accent, palette.vibrant, palette.muted].filter(
    Boolean,
  ) as string[];

  if (colors.length === 0) return 0;

  let totalSaturation = 0;
  for (const hex of colors) {
    const oklchColor = hexToOklch(hex);
    if (oklchColor && oklchColor.c !== undefined) {
      totalSaturation += oklchColor.c;
    }
  }

  return totalSaturation / colors.length;
}

/**
 * Check if palette is mostly neutral/grayscale
 */
function isNeutralPalette(palette: ColorPalette): boolean {
  const saturation = calculateAverageSaturation(palette);
  return saturation < 0.05; // Very low saturation = neutral
}

/**
 * Check if palette is mostly dark
 */
function isDarkPalette(palette: ColorPalette): boolean {
  const colors = [palette.dominant, palette.accent].filter(Boolean) as string[];
  if (colors.length === 0) return false;

  let totalLightness = 0;
  for (const hex of colors) {
    const oklchColor = hexToOklch(hex);
    if (oklchColor && oklchColor.l !== undefined) {
      totalLightness += oklchColor.l;
    }
  }

  const avgLightness = totalLightness / colors.length;
  return avgLightness < 0.4; // Dark if average lightness < 0.4
}

/**
 * Enhance and categorize color palette for gradient generation
 * Transforms raw screenshot colors into a structured palette for creating beautiful gradients
 */
export function enhanceColorPalette(palette: ColorPalette): EnhancedColorPalette {
  const isNeutral = isNeutralPalette(palette);
  const isDark = isDarkPalette(palette);
  const saturation = calculateAverageSaturation(palette);

  // Categorize colors: hero becomes the accent/vibrant, base becomes dominant/muted
  let hero = palette.vibrant ?? palette.accent;
  let base = palette.dominant;

  // If neutral palette with one pop color, amplify that as the hero
  if (isNeutral) {
    // Find the most saturated color
    const colors = [
      { hex: palette.accent, name: "accent" },
      { hex: palette.vibrant, name: "vibrant" },
      { hex: palette.dominant, name: "dominant" },
    ].filter((c) => c.hex) as Array<{ hex: string; name: string }>;

    let maxSaturation = -1;
    let heroCandidate = palette.accent;

    for (const { hex } of colors) {
      const oklchColor = hexToOklch(hex);
      if (oklchColor && oklchColor.c !== undefined && oklchColor.c > maxSaturation) {
        maxSaturation = oklchColor.c;
        heroCandidate = hex;
      }
    }

    hero = heroCandidate;
    base = palette.dominant ?? palette.muted ?? "#1e1e1e";
  }

  // Enhance colors based on palette characteristics
  if (isNeutral && hero) {
    // Boost saturation of hero color for neutral palettes
    hero = enhanceColor(hero, { saturationBoost: 0.5 });
  }

  if (isDark) {
    // Lighten the base for dark palettes to improve contrast
    base = enhanceColor(base, { lightnessShift: 0.3 });
  }

  if (saturation < 0.1 && !isNeutral) {
    // Slightly boost saturation for low-saturation palettes
    hero = enhanceColor(hero, { saturationBoost: 0.2 });
  }

  return {
    hero,
    base,
    accent: palette.accent,
    dominant: palette.dominant,
    vibrant: palette.vibrant,
    muted: palette.muted,
    isNeutral,
    isDark,
    saturation,
  };
}

