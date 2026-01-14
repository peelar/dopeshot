/**
 * Brand Palette Generator
 *
 * Generates brand-consistent color gradients from a user's accent color and mode preference.
 * Uses OKLCH color space for perceptually uniform color manipulation.
 */

import { formatHex, oklch, type Oklch } from "culori";
import type { AdvancedGradient } from "@/domain/layout/gradients/types";

export type BrandMode = "light" | "dark";

export interface GenerateBrandGradientsInput {
  accentColor: string; // Hex color (e.g., "#FF6B35")
  mode: BrandMode;
}

/**
 * Converts hex color to OKLCH color space
 */
function hexToOklch(hex: string): Oklch | null {
  try {
    const color = oklch(hex);
    if (!color || color.l === undefined || color.c === undefined) {
      return null;
    }
    return color;
  } catch {
    return null;
  }
}

/**
 * Converts OKLCH color back to hex
 */
function oklchToHex(color: Oklch): string {
  try {
    return formatHex(color) || "#000000";
  } catch {
    return "#000000";
  }
}

/**
 * Generates a complementary color by rotating hue 180 degrees
 */
function generateComplementary(accentOklch: Oklch): string {
  const complementary: Oklch = {
    ...accentOklch,
    h: accentOklch.h !== undefined ? (accentOklch.h + 180) % 360 : 0,
  };
  return oklchToHex(complementary);
}

/**
 * Generates an analogous color by rotating hue by a small amount
 */
function generateAnalogous(
  accentOklch: Oklch,
  degrees: number = 30,
): string {
  const analogous: Oklch = {
    ...accentOklch,
    h: accentOklch.h !== undefined ? (accentOklch.h + degrees) % 360 : 0,
  };
  return oklchToHex(analogous);
}

/**
 * Generates a dark mode base color (low lightness)
 */
function generateDarkBase(accentOklch: Oklch): string {
  // Use accent hue but very low lightness and chroma for dark base
  const darkBase: Oklch = {
    mode: "oklch",
    l: 0.15, // Very dark (charcoal)
    c: Math.min(accentOklch.c || 0, 0.02), // Almost no chroma
    h: accentOklch.h,
  };
  return oklchToHex(darkBase);
}

/**
 * Generates a light mode base color (high lightness)
 */
function generateLightBase(accentOklch: Oklch): string {
  // Use accent hue but very high lightness and low chroma for light base
  const lightBase: Oklch = {
    mode: "oklch",
    l: 0.95, // Very light (cream/white)
    c: Math.min(accentOklch.c || 0, 0.02), // Almost no chroma
    h: accentOklch.h,
  };
  return oklchToHex(lightBase);
}

/**
 * Adjusts accent color for better visibility in given mode
 */
function adjustAccentForMode(accentOklch: Oklch, mode: BrandMode): string {
  const adjusted: Oklch = { ...accentOklch };

  if (mode === "dark") {
    // For dark mode, ensure accent is bright enough
    adjusted.l = Math.max(accentOklch.l || 0.5, 0.55);
    // Boost chroma slightly for vibrancy
    adjusted.c = Math.min((accentOklch.c || 0) * 1.1, 0.4);
  } else {
    // For light mode, ensure accent is dark enough for contrast
    adjusted.l = Math.min(accentOklch.l || 0.5, 0.65);
    // Keep good chroma
    adjusted.c = Math.max(accentOklch.c || 0, 0.1);
  }

  return oklchToHex(adjusted);
}

/**
 * Creates a gradient with proper stop positions
 */
function createGradient(
  colors: string[],
  angle: number = 135,
): AdvancedGradient {
  const stops = colors.map((color, index) => ({
    color,
    position: (index / (colors.length - 1)) * 100,
  }));

  return {
    type: "linear",
    stops,
    angle,
    colorSpace: "oklch",
    direction: `${angle}deg`,
  };
}

/**
 * Generates 2 brand-consistent gradients from accent color and mode
 */
export function generateBrandGradients(
  input: GenerateBrandGradientsInput,
): AdvancedGradient[] {
  const { accentColor, mode } = input;

  // Parse accent color to OKLCH
  const accentOklch = hexToOklch(accentColor);
  if (!accentOklch) {
    throw new Error(`Invalid accent color: ${accentColor}`);
  }

  // Adjust accent for mode
  const adjustedAccent = adjustAccentForMode(accentOklch, mode);

  // Generate complementary and analogous colors
  const complementary = generateComplementary(accentOklch);
  const analogous = generateAnalogous(accentOklch, 30);

  // Generate base colors based on mode
  const baseColor =
    mode === "dark"
      ? generateDarkBase(accentOklch)
      : generateLightBase(accentOklch);

  // Gradient 1: Base → Accent → Complementary (primary brand gradient)
  const gradient1 = createGradient(
    [baseColor, adjustedAccent, complementary],
    135,
  );

  // Gradient 2: Base → Analogous → Accent (secondary brand gradient)
  const gradient2 = createGradient(
    [baseColor, analogous, adjustedAccent],
    45,
  );

  return [gradient1, gradient2];
}
