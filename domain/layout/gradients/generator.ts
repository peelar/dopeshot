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
import type { Oklch } from "culori";

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
  strategy: "hero-base" | "multi-color" | "complementary" | "analogous" | "triadic" = "multi-color",
): AdvancedGradient {
  const enhanced = enhanceColorPalette(palette);

  // Determine gradient type and direction based on aspect ratio
  let { type, direction, angle } = getGradientGeometry(context);

  // Vary angle based on strategy to create visual distinction
  // Use more dramatic angle differences to make gradients visually distinct
  if (type === "linear" && angle !== undefined) {
    const baseAngle = angle;
    const angleVariations: Record<string, number> = {
      "multi-color": 0, // Keep original angle
      complementary: 135, // Diagonal opposite direction
      analogous: -60, // Different diagonal
      triadic: 45, // Another diagonal
      "hero-base": 0,
    };
    const variation = angleVariations[strategy] ?? 0;
    angle = (baseAngle + variation + 360) % 360;
  }

  // Generate 5-12 color stops with smooth perceptual interpolation
  const stops = generateGradientStops(enhanced, type, context, strategy);

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
 * Get complementary color (180° hue shift) for a given color
 */
function getComplementaryColor(hex: string, boostSaturation = true): string {
  const oklchColor = hexToOklch(hex);
  if (!oklchColor || oklchColor.h === undefined) return hex;

  const complementaryH = (oklchColor.h + 180) % 360;
  const baseC = oklchColor.c ?? 0;
  const enhancedC = boostSaturation
    ? Math.min(0.4, Math.max(0.15, baseC * 1.3)) // Boost saturation more for visibility
    : baseC;

  const complementary: Parameters<typeof oklchToHex>[0] = {
    mode: "oklch",
    l: oklchColor.l ?? 0.5,
    c: enhancedC,
    h: complementaryH,
  };

  return oklchToHex(complementary);
}

/**
 * Get analogous colors (adjacent hues, ±30-45°)
 */
function getAnalogousColors(hex: string, spread = 40): { left: string; right: string } {
  const oklchColor = hexToOklch(hex);
  if (!oklchColor || oklchColor.h === undefined) {
    return { left: hex, right: hex };
  }

  const h = oklchColor.h;
  const leftH = (h - spread + 360) % 360;
  const rightH = (h + spread) % 360;

  const baseL = oklchColor.l ?? 0.5;
  const baseC = oklchColor.c ?? 0;
  // Boost saturation for more visible variation
  const enhancedC = Math.min(0.4, Math.max(0.12, baseC * 1.1));

  return {
    left: oklchToHex({
      mode: "oklch",
      l: Math.max(0.2, Math.min(0.8, baseL - 0.1)), // Slight lightness variation
      c: enhancedC,
      h: leftH,
    }),
    right: oklchToHex({
      mode: "oklch",
      l: Math.max(0.2, Math.min(0.8, baseL + 0.1)), // Slight lightness variation
      c: enhancedC,
      h: rightH,
    }),
  };
}

/**
 * Get triadic colors (120° apart)
 */
function getTriadicColors(hex: string): { second: string; third: string } {
  const oklchColor = hexToOklch(hex);
  if (!oklchColor || oklchColor.h === undefined) {
    return { second: hex, third: hex };
  }

  const h = oklchColor.h;
  const baseL = oklchColor.l ?? 0.5;
  const baseC = oklchColor.c ?? 0;
  // Ensure good saturation for triadic colors
  const enhancedC = Math.min(0.4, Math.max(0.15, baseC * 1.2));

  return {
    second: oklchToHex({
      mode: "oklch",
      l: Math.max(0.25, Math.min(0.75, baseL + 0.15)), // Vary lightness
      c: enhancedC,
      h: (h + 120) % 360,
    }),
    third: oklchToHex({
      mode: "oklch",
      l: Math.max(0.25, Math.min(0.75, baseL - 0.15)), // Vary lightness
      c: enhancedC,
      h: (h + 240) % 360,
    }),
  };
}

/**
 * Generate 5-12 color stops for a smooth, professional gradient
 * Uses OKLCH color space interpolation for perceptual uniformity
 * Now supports multi-color gradients with complementary colors
 */
function generateGradientStops(
  palette: EnhancedColorPalette,
  type: GradientType,
  context: GradientContext,
  strategy: "hero-base" | "multi-color" | "complementary" | "analogous" | "triadic" = "multi-color",
): GradientStop[] {
  const { hero, base, accent, vibrant, muted, dominant, isNeutral, isDark } = palette;

  // Convert all available colors to OKLCH
  const heroOklch = hexToOklch(hero);
  const baseOklch = hexToOklch(base);
  const accentOklch = accent ? hexToOklch(accent) : null;
  const vibrantOklch = vibrant ? hexToOklch(vibrant) : null;
  const mutedOklch = muted ? hexToOklch(muted) : null;
  const dominantOklch = dominant ? hexToOklch(dominant) : null;

  if (!heroOklch || !baseOklch) {
    // Fallback to simple 2-color if conversion fails
    return [
      { color: hero, position: 0 },
      { color: base, position: 100 },
    ];
  }

  const stops: GradientStop[] = [];

  // Determine number of stops (5-12 as per PRD)
  const numStops = isNeutral ? 9 : isDark ? 11 : 8;

  // Build color sequence based on strategy
  let colorSequence: Array<{ oklch: Oklch; weight: number }> = [];

  if (strategy === "hero-base") {
    // Simple two-color interpolation
    colorSequence = [
      { oklch: heroOklch, weight: 1 },
      { oklch: baseOklch, weight: 1 },
    ];
  } else if (strategy === "complementary") {
    // Complementary strategy: Use complementary colors as the PRIMARY colors, not just accents
    // This creates a fundamentally different gradient from the palette
    const complementary = getComplementaryColor(hero);
    const compOklch = hexToOklch(complementary);

    // Get complementary of base too for more variety
    const baseComplementary = getComplementaryColor(base);
    const baseCompOklch = hexToOklch(baseComplementary);

    // Get a split-complementary (one side of complementary)
    const heroOklchForComp = hexToOklch(hero);
    if (heroOklchForComp && heroOklchForComp.h !== undefined) {
      const splitCompH = (heroOklchForComp.h + 150) % 360; // 30° offset from complementary
      const splitCompOklch: Oklch = {
        mode: "oklch",
        l: heroOklchForComp.l ?? 0.5,
        c: Math.min(0.4, Math.max(0.2, (heroOklchForComp.c ?? 0) * 1.4)),
        h: splitCompH,
      };

      if (compOklch && baseCompOklch) {
        colorSequence = [
          { oklch: heroOklch, weight: 1 }, // Start with palette hero
          { oklch: compOklch, weight: 1.5 }, // Primary complementary - outside palette
          { oklch: splitCompOklch, weight: 1.2 }, // Split-complementary - outside palette
          { oklch: baseCompOklch, weight: 1.1 }, // Base complementary - outside palette
          { oklch: baseOklch, weight: 1 }, // End with palette base
        ];
      } else if (compOklch) {
        colorSequence = [
          { oklch: heroOklch, weight: 1 },
          { oklch: compOklch, weight: 1.5 },
          { oklch: splitCompOklch, weight: 1.2 },
          { oklch: baseOklch, weight: 1 },
        ];
      } else {
        colorSequence = [
          { oklch: heroOklch, weight: 1 },
          { oklch: baseOklch, weight: 1 },
        ];
      }
    } else {
      colorSequence = [
        { oklch: heroOklch, weight: 1 },
        { oklch: baseOklch, weight: 1 },
      ];
    }
  } else if (strategy === "analogous") {
    // Analogous strategy: Use ONLY analogous colors (adjacent hues), not palette colors
    // This creates a smooth, harmonious gradient that's different from the palette
    const analogous = getAnalogousColors(hero, 50); // Wider spread for more variation
    const leftOklch = hexToOklch(analogous.left);
    const rightOklch = hexToOklch(analogous.right);

    // Get analogous colors from base too
    const baseAnalogous = getAnalogousColors(base, 40);
    const baseLeftOklch = hexToOklch(baseAnalogous.left);
    const baseRightOklch = hexToOklch(baseAnalogous.right);

    colorSequence = [
      { oklch: leftOklch || heroOklch, weight: 1.2 }, // Analogous left - outside palette
      { oklch: heroOklch, weight: 1.5 }, // Palette hero as anchor
      { oklch: rightOklch || heroOklch, weight: 1.2 }, // Analogous right - outside palette
      { oklch: baseLeftOklch || baseOklch, weight: 1 }, // Base analogous left
      { oklch: baseOklch, weight: 1.3 }, // Palette base as anchor
      { oklch: baseRightOklch || baseOklch, weight: 1 }, // Base analogous right
    ].filter((c) => c.oklch);
  } else if (strategy === "triadic") {
    // Triadic strategy: Use triadic colors as PRIMARY colors
    // This creates a vibrant, dynamic gradient that's fundamentally different
    const triadic = getTriadicColors(hero);
    const secondOklch = hexToOklch(triadic.second);
    const thirdOklch = hexToOklch(triadic.third);

    // Get triadic colors from base too for more variety
    const baseTriadic = getTriadicColors(base);
    const baseSecondOklch = hexToOklch(baseTriadic.second);
    const baseThirdOklch = hexToOklch(baseTriadic.third);

    // Build sequence using triadic colors as the main colors, with palette as anchors
    colorSequence = [
      { oklch: heroOklch, weight: 1.5 }, // Palette hero as start anchor
      { oklch: secondOklch || heroOklch, weight: 1.4 }, // Primary triadic - outside palette
      { oklch: thirdOklch || secondOklch || heroOklch, weight: 1.3 }, // Second triadic - outside palette
      { oklch: baseSecondOklch || baseOklch, weight: 1.2 }, // Base triadic - outside palette
      { oklch: baseOklch, weight: 1.5 }, // Palette base as end anchor
      { oklch: baseThirdOklch || baseOklch, weight: 1.1 }, // Base triadic variant
    ].filter((c) => c.oklch);
  } else {
    // multi-color: Use multiple colors from palette
    const availableColors = [
      { oklch: heroOklch, weight: 2 },
      { oklch: baseOklch, weight: 1.5 },
    ];

    if (vibrantOklch && vibrant !== hero) {
      availableColors.push({ oklch: vibrantOklch, weight: 1.3 });
    }
    if (accentOklch && accent !== hero && accent !== vibrant) {
      availableColors.push({ oklch: accentOklch, weight: 1.2 });
    }
    if (mutedOklch && muted !== base) {
      availableColors.push({ oklch: mutedOklch, weight: 0.8 });
    }
    if (dominantOklch && dominant !== base && dominant !== hero) {
      availableColors.push({ oklch: dominantOklch, weight: 1 });
    }

    // If we have enough colors, add a complementary accent
    if (availableColors.length >= 2) {
      const complementary = getComplementaryColor(hero);
      const compOklch = hexToOklch(complementary);
      if (compOklch) {
        availableColors.splice(Math.floor(availableColors.length / 2), 0, {
          oklch: compOklch,
          weight: 1.1,
        });
      }
    }

    colorSequence = availableColors;
  }

  // Normalize weights to create position distribution
  const totalWeight = colorSequence.reduce((sum, c) => sum + c.weight, 0);
  let cumulativeWeight = 0;
  const colorPositions = colorSequence.map((c) => {
    cumulativeWeight += c.weight;
    return cumulativeWeight / totalWeight;
  });

  // Generate stops along the color sequence path
  for (let i = 0; i <= numStops; i++) {
    const t = i / numStops; // 0 to 1

    // Find which color segment we're in
    let segmentIndex = 0;
    for (let j = 0; j < colorPositions.length - 1; j++) {
      if (t >= colorPositions[j] && t <= colorPositions[j + 1]) {
        segmentIndex = j;
        break;
      }
    }
    if (t >= colorPositions[colorPositions.length - 1]) {
      segmentIndex = colorPositions.length - 2;
    }

    const startPos = colorPositions[segmentIndex];
    const endPos = colorPositions[segmentIndex + 1];
    const segmentT = endPos > startPos ? (t - startPos) / (endPos - startPos) : 0;

    const startColor = colorSequence[segmentIndex].oklch;
    const endColor = colorSequence[segmentIndex + 1].oklch;

    // Interpolate in OKLCH space
    const l = lerp(startColor.l ?? 0.5, endColor.l ?? 0.5, segmentT);
    let c = lerp(startColor.c ?? 0, endColor.c ?? 0, segmentT);

    // For hue, handle wraparound (shorter path)
    let h: number;
    const startH = startColor.h ?? 0;
    const endH = endColor.h ?? 0;
    const diff = ((endH - startH + 180) % 360) - 180;
    h = (startH + diff * segmentT) % 360;

    // Apply enhancement based on position
    let finalL = l;
    let finalC = c;

    // Enhance stops in the middle to avoid muddiness
    if (t > 0.25 && t < 0.75) {
      // Boost saturation in middle stops to avoid dead zones
      finalC = Math.min(0.4, c * 1.3);
    }

    // Adjust lightness curve for better contrast
    if (isDark) {
      // Lighten the middle stops more for dark palettes
      if (t > 0.3 && t < 0.85) {
        finalL = Math.min(0.9, l + 0.2);
      }
    } else {
      // Create subtle S-curve for lighter palettes
      const sCurve = t < 0.5 ? t * 2 : 1 - (t - 0.5) * 2;
      finalL = lerp(l, l + 0.12 * (sCurve - 0.5), 0.4);
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
  if (isNeutral && strategy !== "complementary") {
    // Insert an enhanced hero color stop at the beginning
    const enhancedHero = enhanceColor(hero, { saturationBoost: 0.7 });
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
 * Each option uses a different color strategy for maximum visual variety
 */
export function generateGradientOptions(
  palette: ColorPalette,
  context: GradientContext,
): AdvancedGradient[] {
  const enhanced = enhanceColorPalette(palette);
  const options: AdvancedGradient[] = [];

  // Option 1: Multi-color (uses all palette colors + complementary)
  // This is the default rich gradient
  options.push(generateGradient(palette, context, "multi-color"));

  // Option 2: Complementary (hero → complementary → base)
  // Creates high contrast, vibrant gradients
  options.push(generateGradient(palette, context, "complementary"));

  // Option 3: Analogous (adjacent hues from hero)
  // Creates smooth, harmonious gradients
  options.push(generateGradient(palette, context, "analogous"));

  // Option 4: Triadic (three colors 120° apart)
  // Creates dynamic, colorful gradients
  options.push(generateGradient(palette, context, "triadic"));

  // Option 5: Simple hero-base (if we want a 5th option)
  // Fallback simpler gradient
  if (options.length < 4) {
    options.push(generateGradient(palette, context, "hero-base"));
  }

  return options.slice(0, 4); // Return up to 4 options
}
