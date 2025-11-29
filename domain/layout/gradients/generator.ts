import { AspectCategory } from "../aspect";
import { AdvancedGradient, GradientStop, GradientType } from "./types";
import { ColorPalette } from "@/domain/asset/types";
import {
  enhanceColorPalette,
  EnhancedColorPalette,
  hexToOklch,
  oklchToHex,
  enhanceColor,
} from "./colors";

/**
 * Context for gradient generation
 */
export type GradientContext = {
  aspectCategory: AspectCategory;
  templateVariant?: string; // e.g., "left", "right", "center"
};

/**
 * Generate a beautiful multi-stop gradient from a color palette
 * Implements PRD-003 requirements for professional, designer-grade gradients
 */
export function generateGradient(
  palette: ColorPalette,
  context: GradientContext,
): AdvancedGradient {
  const enhanced = enhanceColorPalette(palette);

  // Determine gradient type and direction based on aspect ratio
  const { type, direction, angle } = getGradientGeometry(context);

  // Generate 5-12 color stops with smooth perceptual interpolation
  const stops = generateGradientStops(enhanced, type, context);

  return {
    type,
    stops,
    direction,
    angle,
    colorSpace: "oklch", // Use OKLCH for perceptual uniformity
  };
}

/**
 * Determine gradient geometry (type, direction, angle) based on aspect ratio
 * Adapts gradient to frame the screenshot correctly
 */
function getGradientGeometry(context: GradientContext): {
  type: GradientType;
  direction?: string;
  angle?: number;
} {
  const { aspectCategory, templateVariant } = context;

  // Vertical/portrait: diagonal gradient to create depth
  if (aspectCategory === "portrait") {
    return {
      type: "linear",
      angle: 135, // Diagonal from top-left to bottom-right
    };
  }

  // Landscape: side-anchored or horizontal
  if (aspectCategory === "landscape") {
    return {
      type: "linear",
      angle: templateVariant === "left" ? 90 : 270, // Horizontal, adapt to text side
    };
  }

  // Ultrawide: long-axis linear gradient
  if (aspectCategory === "ultrawide") {
    return {
      type: "linear",
      angle: 0, // Horizontal along long axis
    };
  }

  // Square: radial gradient for balanced composition
  if (aspectCategory === "square") {
    return {
      type: "radial",
      direction: "circle at 30% 50%", // Offset for visual interest
    };
  }

  // Default: diagonal linear
  return {
    type: "linear",
    angle: 135,
  };
}

/**
 * Generate 5-12 color stops for a smooth, professional gradient
 * Uses OKLCH color space interpolation for perceptual uniformity
 */
function generateGradientStops(
  palette: EnhancedColorPalette,
  type: GradientType,
  context: GradientContext,
): GradientStop[] {
  const { hero, base, isNeutral, isDark } = palette;

  // Convert to OKLCH for interpolation
  const heroOklch = hexToOklch(hero);
  const baseOklch = hexToOklch(base);

  if (!heroOklch || !baseOklch) {
    // Fallback to simple 2-color if conversion fails
    return [
      { color: hero, position: 0 },
      { color: base, position: 100 },
    ];
  }

  const stops: GradientStop[] = [];

  // Determine number of stops (5-12 as per PRD)
  // More stops for complex palettes, fewer for simple ones
  const numStops = isNeutral ? 8 : isDark ? 10 : 7;

  // Generate stops along perceptual path
  for (let i = 0; i <= numStops; i++) {
    const t = i / numStops; // 0 to 1

    // Interpolate in OKLCH space
    const l = lerp(heroOklch.l ?? 0.5, baseOklch.l ?? 0.5, t);
    const c = lerp(heroOklch.c ?? 0, baseOklch.c ?? 0, t);

    // For hue, handle wraparound (shorter path)
    let h: number;
    const heroH = heroOklch.h ?? 0;
    const baseH = baseOklch.h ?? 0;

    // Find shortest hue path
    const diff = ((baseH - heroH + 180) % 360) - 180;
    h = (heroH + diff * t) % 360;

    // Apply enhancement based on position
    let finalL = l;
    let finalC = c;

    // Enhance stops in the middle to avoid muddiness
    if (t > 0.3 && t < 0.7) {
      // Slightly boost saturation in middle stops to avoid dead zones
      finalC = Math.min(0.4, c * 1.2);
    }

    // Adjust lightness curve for better contrast
    if (isDark) {
      // Lighten the middle stops more for dark palettes
      if (t > 0.4 && t < 0.8) {
        finalL = Math.min(0.9, l + 0.15);
      }
    } else {
      // Create subtle S-curve for lighter palettes
      const sCurve = t < 0.5 ? t * 2 : 1 - (t - 0.5) * 2;
      finalL = lerp(l, l + 0.1 * (sCurve - 0.5), 0.3);
    }

    const interpolated: Parameters<typeof oklchToHex>[0] = {
      mode: "oklch",
      l: Math.max(0, Math.min(1, finalL)),
      c: Math.max(0, Math.min(0.4, finalC)),
      h,
    };

    const color = oklchToHex(interpolated);
    const position = (i / numStops) * 100; // 0 to 100%

    stops.push({ color, position });
  }

  // Special handling for neutral palettes: add accent stops
  if (isNeutral) {
    // Insert an enhanced hero color stop at the beginning
    const enhancedHero = enhanceColor(hero, { saturationBoost: 0.6 });
    stops[0] = { color: enhancedHero, position: 0 };

    // Add a deep neutral stop in the middle
    const deepNeutral = enhanceColor(base, { lightnessShift: -0.3 });
    const midIndex = Math.floor(stops.length / 2);
    stops.splice(midIndex, 0, { color: deepNeutral, position: 50 });
  }

  return stops;
}

/**
 * Linear interpolation helper
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generate multiple gradient options from a palette
 * Used in gradient picker to show different variations
 */
export function generateGradientOptions(
  palette: ColorPalette,
  context: GradientContext,
): AdvancedGradient[] {
  const enhanced = enhanceColorPalette(palette);
  const options: AdvancedGradient[] = [];

  // Option 1: Hero to base (primary gradient)
  options.push(generateGradient(palette, context));

  // Option 2: Vibrant to deep (if vibrant exists)
  if (enhanced.vibrant) {
    const vibrantPalette: ColorPalette = {
      ...palette,
      accent: enhanced.vibrant,
    };
    options.push(generateGradient(vibrantPalette, context));
  }

  // Option 3: Light variant (boosted lightness)
  const lightHero = enhanceColor(enhanced.hero, { lightnessShift: 0.4 });
  const lightPalette: ColorPalette = {
    ...palette,
    accent: lightHero,
  };
  options.push(generateGradient(lightPalette, context));

  // Option 4: Deep variant (reduced lightness, increased saturation)
  const deepHero = enhanceColor(enhanced.hero, { lightnessShift: -0.2, saturationBoost: 0.3 });
  const deepPalette: ColorPalette = {
    ...palette,
    accent: deepHero,
  };
  options.push(generateGradient(deepPalette, context));

  return options.slice(0, 4); // Return up to 4 options
}

