import { converter, formatHex, type Oklch } from "culori";
import { ColorPalette } from "@/domain/asset/types";

/**
 * Convert hex color to OKLCH color space
 */
function hexToOklch(hex: string): Oklch | null {
  try {
    const convert = converter("oklch");
    const result = convert(hex);
    return result && typeof result === "object" && "l" in result ? (result as Oklch) : null;
  } catch {
    return null;
  }
}

/**
 * Convert OKLCH color to hex
 */
function oklchToHex(color: Oklch): string {
  try {
    return formatHex(color);
  } catch {
    return "#000000";
  }
}

/**
 * Color harmony types for generating complementary colors
 */
export type ColorHarmony = "complementary" | "analogous" | "triadic" | "split-complementary";

/**
 * Generate a neon/electric version of a color at a given hue offset.
 * Creates maximally saturated, eye-catching colors for vibrant mesh gradients.
 *
 * @param baseHex - The base color in hex format
 * @param hueOffset - Degrees to rotate the hue (0-360)
 * @returns A neon hex color with high chroma and optimal lightness
 */
export function generateNeonColor(baseHex: string, hueOffset: number): string {
  const oklch = hexToOklch(baseHex);
  if (!oklch) return baseHex;

  const baseHue = oklch.h ?? 0;
  const newHue = ((baseHue + hueOffset) % 360 + 360) % 360;

  // Neon colors need high chroma and optimal lightness for that "glowing" effect
  // Different hues have different optimal lightness for maximum perceived vibrancy
  // We use 0.40 chroma which may get slightly reduced during gamut mapping
  const neonColor: Oklch = {
    mode: "oklch",
    l: getNeonLightness(newHue), // Hue-dependent lightness for best vibrancy
    c: 0.40, // Maximum chroma for electric effect (slightly reduced after gamut mapping)
    h: newHue,
  };

  return oklchToHex(neonColor);
}

/**
 * Get optimal lightness for a neon color based on its hue.
 * Different hues appear most vibrant at different lightness levels.
 * Cyan/teal hues (160-210°) have severely limited sRGB gamut (~0.16 max chroma),
 * so we use higher lightness to maximize their achievable saturation.
 */
function getNeonLightness(hue: number): number {
  // Cyan/teal (160-210°) - pure cyan #00FFFF is at L=0.91, C=0.155
  // Use high lightness to maximize the limited gamut
  if (hue >= 160 && hue <= 210) {
    return 0.85; // High lightness maximizes cyan chroma in sRGB
  }
  // Yellow/green hues need higher lightness to appear vibrant
  if (hue >= 60 && hue <= 160) {
    return 0.72;
  }
  // Blue range (210-270°) - moderate lightness
  if (hue >= 210 && hue <= 270) {
    return 0.58;
  }
  // Purple/magenta range (270-330°) - can be slightly lighter
  if (hue >= 270 && hue <= 330) {
    return 0.62;
  }
  // Red/orange/pink range - medium lightness
  return 0.67;
}

/**
 * Generate a harmonious color from a base color using hue rotation.
 * Uses color theory principles to create visually pleasing color combinations.
 *
 * @param baseHex - The base color in hex format
 * @param harmony - The type of color harmony to apply
 * @param variant - For harmonies with multiple options (0 or 1)
 * @returns A new hex color based on the harmony rule
 */
export function generateHarmonyColor(
  baseHex: string,
  harmony: ColorHarmony,
  variant: number = 0,
): string {
  const oklch = hexToOklch(baseHex);
  if (!oklch) return baseHex;

  const baseHue = oklch.h ?? 0;
  let newHue: number;

  switch (harmony) {
    case "complementary":
      // 180° rotation - opposite on the color wheel
      newHue = baseHue + 180;
      break;
    case "analogous":
      // ±30° rotation - adjacent colors
      newHue = baseHue + (variant === 0 ? 30 : -30);
      break;
    case "triadic":
      // 120° or 240° rotation - three evenly spaced colors
      newHue = baseHue + (variant === 0 ? 120 : 240);
      break;
    case "split-complementary":
      // 150° or 210° rotation - either side of the complement
      newHue = baseHue + (variant === 0 ? 150 : 210);
      break;
    default:
      newHue = baseHue;
  }

  // Normalize hue to 0-360 range
  newHue = ((newHue % 360) + 360) % 360;

  // Maintain similar chroma and lightness, but ensure vibrant result
  const newColor: Oklch = {
    mode: "oklch",
    l: Math.max(0.35, Math.min(0.75, oklch.l)), // Keep lightness in pleasing range
    c: Math.max(0.12, oklch.c ?? 0.15), // Ensure minimum saturation for vibrant result
    h: newHue,
  };

  return oklchToHex(newColor);
}

/**
 * Check if two colors have similar hues (within threshold)
 */
export function areHuesSimilar(hexA: string, hexB: string, threshold: number = 40): boolean {
  const oklchA = hexToOklch(hexA);
  const oklchB = hexToOklch(hexB);

  if (!oklchA || !oklchB) return false;

  const hueA = oklchA.h ?? 0;
  const hueB = oklchB.h ?? 0;

  // Handle wraparound at 360°
  const rawDelta = Math.abs(hueA - hueB);
  const hueDelta = Math.min(rawDelta, 360 - rawDelta);

  return hueDelta < threshold;
}

/**
 * Check if a color pool is effectively monochromatic.
 * Returns true if all saturated colors have similar hues.
 * Low-saturation colors (whites, grays, blacks) are ignored since they have no meaningful hue.
 */
export function isPoolMonochromatic(pool: string[], threshold: number = 40): boolean {
  if (pool.length <= 1) return true;

  // Filter to only colors with meaningful saturation
  const saturatedColors = pool.filter((hex) => {
    const oklch = hexToOklch(hex);
    if (!oklch) return false;
    // Ignore colors with very low chroma (grays, whites, blacks)
    return (oklch.c ?? 0) > 0.04;
  });

  // If no saturated colors or only one, consider it monochromatic
  if (saturatedColors.length <= 1) return true;

  const firstColor = saturatedColors[0];
  for (let i = 1; i < saturatedColors.length; i++) {
    if (!areHuesSimilar(firstColor, saturatedColors[i], threshold)) {
      return false;
    }
  }

  return true;
}

/**
 * Enforce minimum chromatic separation between two colors.
 * If colors are too similar in both hue and luminance, artificially
 * create contrast by pushing one color darker or lighter.
 *
 * This ensures gradients have visible direction rather than appearing muddy.
 */
export function enforceColorSeparation(
  colorA: string,
  colorB: string,
  minHueDelta = 30,
  minLightnessDelta = 0.25
): { colorA: string; colorB: string } {
  const oklchA = hexToOklch(colorA);
  const oklchB = hexToOklch(colorB);

  if (!oklchA || !oklchB) {
    return { colorA, colorB };
  }

  // Calculate hue delta (handle wraparound at 360)
  const hueA = oklchA.h ?? 0;
  const hueB = oklchB.h ?? 0;
  const rawHueDelta = Math.abs(hueA - hueB);
  const hueDelta = Math.min(rawHueDelta, 360 - rawHueDelta);

  const lightnessDelta = Math.abs(oklchA.l - oklchB.l);

  // If both deltas are below threshold, invent contrast
  if (hueDelta < minHueDelta && lightnessDelta < minLightnessDelta) {
    // Push colorB darker if colorA is light, lighter if colorA is dark
    const shift = oklchA.l > 0.5 ? -0.35 : 0.35;
    return {
      colorA,
      colorB: enhanceColor(colorB, { lightnessShift: shift }),
    };
  }

  return { colorA, colorB };
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
    c = Math.min(0.45, c + saturationBoost * 0.3);
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
 * Mix a color with a bias anchor color in OKLCH space.
 * Used to inject warm/cool tones into neutral palettes.
 */
function mixWithBias(hex: string, biasHex: string, ratio: number): string {
  const oklchBase = hexToOklch(hex);
  const oklchBias = hexToOklch(biasHex);

  if (!oklchBase || !oklchBias) return hex;

  // Mix lightness and chroma, but shift hue toward bias
  const l = oklchBase.l * (1 - ratio * 0.5) + oklchBias.l * (ratio * 0.5);
  const c = Math.max(oklchBase.c ?? 0, (oklchBias.c ?? 0) * ratio * 0.8);

  // Blend hue toward bias color
  const baseH = oklchBase.h ?? 0;
  const biasH = oklchBias.h ?? 0;
  const h = baseH + (biasH - baseH) * ratio;

  const mixed: Oklch = {
    mode: "oklch",
    l: Math.max(0.1, Math.min(0.9, l)),
    c: Math.min(0.35, c),
    h: ((h % 360) + 360) % 360,
  };

  return oklchToHex(mixed);
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

  // If truly neutral (very low saturation), inject warm/cool bias
  // This ensures neutral screenshots don't produce neutral (muddy) gradients
  if (isNeutral && saturation < 0.08) {
    const warmAnchor = "#f97316"; // orange
    const coolAnchor = "#6366f1"; // indigo
    // Pick based on average lightness - dark palettes get warm, light get cool
    const biasColor = isDark ? warmAnchor : coolAnchor;
    hero = mixWithBias(hero ?? base, biasColor, 0.4);
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
