import { AspectCategory } from "../aspect";
import { AdvancedGradient, GradientStop, GradientType, MeshLayer } from "./types";
import { ColorPalette } from "@/domain/asset/types";
import {
  enhanceColorPalette,
  EnhancedColorPalette,
  enhanceColor,
  enforceColorSeparation,
  generateHarmonyColor,
  isPoolMonochromatic,
} from "./colors";
import { hexToRgba } from "./utils";

type GradientVariation = {
  colorPair?: [string, string];
};

/**
 * Context for gradient generation
 */
export type GradientContext = {
  aspectCategory: AspectCategory;
  variant?: string; // e.g., "left", "right", "center"
};

/**
 * Generate a beautiful multi-stop gradient from a color palette
 * Implements PRD-003 requirements for professional, designer-grade gradients
 */
function generateGradient(
  palette: ColorPalette,
  context: GradientContext,
  strategy: "hero-base" | "multi-color" | "complementary" | "analogous" | "triadic" = "multi-color",
  variation?: GradientVariation,
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

  // Generate exactly three color stops (two from screenshot + one ambient background)
  const stops = generateGradientStops(enhanced, strategy, variation);

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
  const { aspectCategory } = context;

  // Vertical/portrait: diagonal gradient to create depth
  if (aspectCategory === "portrait") {
    return {
      type: "linear",
      angle: 135, // Diagonal from top-left to bottom-right
    };
  }

  // Landscape: diagonal gradient for fluid color transitions
  if (aspectCategory === "landscape") {
    return {
      type: "linear",
      angle: 135, // Diagonal from top-left to bottom-right
    };
  }

  // Ultrawide: diagonal gradient for fluid color transitions
  if (aspectCategory === "ultrawide") {
    return {
      type: "linear",
      angle: 45, // Diagonal from bottom-left to top-right
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
 * Generate gradient stops from screenshot colors.
 * Uses 2 stops for clean transitions - 3-color gradients with extreme contrast
 * (bright → dark → bright) create visual "valleys" that look unnatural.
 * Enforces chromatic separation to prevent muddy gradients.
 */
function generateGradientStops(
  palette: EnhancedColorPalette,
  strategy: "hero-base" | "multi-color" | "complementary" | "analogous" | "triadic" = "multi-color",
  variation?: GradientVariation,
): GradientStop[] {
  const [rawPrimary, rawSecondary] = variation?.colorPair ?? getProminentScreenshotColors(palette);

  // Enforce chromatic separation to prevent muddy gradients
  const { colorA: primary, colorB: secondary } = enforceColorSeparation(rawPrimary, rawSecondary);

  const start = adjustProminentColor(
    strategy === "complementary" || strategy === "triadic" ? secondary : primary,
    "start",
    palette,
    strategy,
  );
  const end = adjustProminentColor(
    strategy === "complementary" || strategy === "triadic" ? primary : secondary,
    "end",
    palette,
    strategy,
  );

  // Simple 2-stop gradient for smooth transition between screenshot colors
  return [
    { color: start, position: 0 },
    { color: end, position: 100 },
  ];
}

/**
 * Determine the two most prominent screenshot colors (hero & base fallbacks)
 */
function getProminentScreenshotColors(palette: EnhancedColorPalette): [string, string] {
  const pool = getPaletteColorPool(palette);
  return [pool[0], pool[1]];
}

/**
 * Slightly adjust prominent colors per strategy without introducing new hues
 */
function adjustProminentColor(
  color: string,
  role: "start" | "end",
  palette: EnhancedColorPalette,
  strategy: string,
): string {
  if (!color) {
    return color;
  }

  if (strategy === "analogous") {
    return enhanceColor(color, { lightnessShift: role === "start" ? -0.05 : 0.08 });
  }

  if (strategy === "triadic") {
    return enhanceColor(color, { saturationBoost: 0.2 });
  }

  if (strategy === "complementary") {
    return enhanceColor(color, {
      saturationBoost: 0.1,
      lightnessShift: role === "start" ? -0.04 : 0.04,
    });
  }

  if (strategy === "hero-base" && palette.isNeutral) {
    return enhanceColor(color, { saturationBoost: 0.3 });
  }

  return color;
}

function getPaletteColorPool(palette: EnhancedColorPalette): string[] {
  const candidates = [
    palette.hero,
    palette.base,
    palette.dominant,
    palette.accent,
    palette.vibrant,
    palette.muted,
  ].filter(Boolean) as string[];

  const unique: string[] = [];
  for (const hex of candidates) {
    if (!unique.find((existing) => existing.toLowerCase() === hex.toLowerCase())) {
      unique.push(hex);
    }
  }

  if (unique.length === 0) {
    return ["#9333EA", "#6366F1"];
  }

  if (unique.length === 1) {
    const derived = palette.isDark
      ? enhanceColor(unique[0], { lightnessShift: 0.35 })
      : enhanceColor(unique[0], { lightnessShift: -0.25 });
    unique.push(derived);
  }

  return unique;
}

/**
 * Build color pairs for gradient generation.
 * When the palette is monochromatic (limited color variety), uses color theory
 * harmonies to generate visually distinct gradient options.
 */
function buildColorPairs(palette: EnhancedColorPalette, count: number): [string, string][] {
  const pool = getPaletteColorPool(palette);
  const pairs: [string, string][] = [];

  // Detect if the palette is effectively monochromatic
  const isMonochromatic = isPoolMonochromatic(pool);

  if (isMonochromatic && pool.length > 0) {
    // Use the hero color (most prominent/saturated) as the base
    const baseColor = palette.hero ?? pool[0];

    // Generate 4 distinct gradient pairs using color theory harmonies
    // Each pair uses a different harmony rule for maximum visual variety
    for (let i = 0; i < count; i++) {
      switch (i) {
        case 0:
          // Pair 0: Original color with slight lightness variation
          pairs.push([
            baseColor,
            enhanceColor(baseColor, { lightnessShift: -0.25 }),
          ]);
          break;
        case 1:
          // Pair 1: Complementary (180° hue rotation) - opposite on color wheel
          pairs.push([
            baseColor,
            generateHarmonyColor(baseColor, "complementary"),
          ]);
          break;
        case 2:
          // Pair 2: Triadic (120° hue rotation) - vibrant contrast
          pairs.push([
            baseColor,
            generateHarmonyColor(baseColor, "triadic", 0),
          ]);
          break;
        case 3:
          // Pair 3: Split-complementary (150° hue rotation) - sophisticated contrast
          pairs.push([
            baseColor,
            generateHarmonyColor(baseColor, "split-complementary", 0),
          ]);
          break;
        default:
          // Fallback for additional pairs: use triadic variant
          pairs.push([
            baseColor,
            generateHarmonyColor(baseColor, "triadic", 1),
          ]);
      }
    }

    return pairs;
  }

  // Non-monochromatic: use existing pool rotation logic
  for (let i = 0; i < count; i++) {
    const start = pool[i % pool.length];
    const end = pool[(i + 1) % pool.length];

    if (start.toLowerCase() === end.toLowerCase()) {
      const adjustedEnd = enhanceColor(end, {
        saturationBoost: 0.15,
        lightnessShift: i % 2 === 0 ? 0.1 : -0.12,
      });
      pairs.push([start, adjustedEnd]);
    } else {
      pairs.push([start, end]);
    }
  }

  return pairs;
}

/**
 * Generate mesh gradient with multiple organic blob layers
 * Creates fluid, modern shapes using overlaid radial gradients
 * Uses colors from screenshot palette for cohesive design
 */
function generateMeshGradient(
  palette: ColorPalette,
  enhanced: EnhancedColorPalette,
): AdvancedGradient {
  const colors = getPaletteColorPool(enhanced);

  // Create 3-4 mesh layers with varied positions and sizes
  // Positions are offset to create visual interest and organic flow
  const meshLayers: MeshLayer[] = [
    {
      color: hexToRgba(colors[0], 0.85), // Primary - top left quadrant
      position: { x: 20, y: 25 },
      size: 75,
    },
    {
      color: hexToRgba(colors[1] || colors[0], 0.7), // Secondary - bottom right
      position: { x: 80, y: 75 },
      size: 70,
    },
    {
      color: hexToRgba(colors[2] || colors[1] || colors[0], 0.6), // Tertiary - center-bottom
      position: { x: 50, y: 60 },
      size: 85,
    },
  ];

  // Add fourth layer for richer palettes (top-right accent)
  if (colors.length >= 3) {
    meshLayers.push({
      color: hexToRgba(colors[2], 0.5),
      position: { x: 85, y: 20 },
      size: 55,
    });
  }

  return {
    type: "linear", // Type is used for fallback; mesh renders via meshLayers
    stops: [
      { color: colors[0], position: 0 },
      { color: colors[1] || colors[0], position: 100 },
    ],
    meshLayers,
    colorSpace: "oklch",
  };
}

/**
 * Generate aurora gradient with ethereal flowing wave effect
 * Uses 4 color stops for smooth, layered transitions
 * Creates northern lights inspired aesthetic
 */
function generateAuroraGradient(
  palette: ColorPalette,
  enhanced: EnhancedColorPalette,
): AdvancedGradient {
  const colors = getPaletteColorPool(enhanced);
  const primary = colors[0];
  const secondary = colors[1] || enhanceColor(primary, { lightnessShift: 0.2 });
  const tertiary = colors[2] || enhanceColor(secondary, { lightnessShift: -0.15 });

  // Aurora uses 4 stops for smooth wave-like transitions
  // Positions create bands of color that flow into each other
  const stops: GradientStop[] = [
    { color: primary, position: 0 },
    { color: enhanceColor(primary, { lightnessShift: 0.08, saturationBoost: 0.1 }), position: 25 },
    { color: secondary, position: 55 },
    { color: tertiary, position: 100 },
  ];

  return {
    type: "linear",
    stops,
    angle: 135, // Diagonal for flowing effect
    colorSpace: "oklch",
  };
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

  // Original 4 linear gradient strategies
  const strategies: Array<"multi-color" | "complementary" | "analogous" | "triadic"> = [
    "multi-color",
    "complementary",
    "analogous",
    "triadic",
  ];

  const colorPairs = buildColorPairs(enhanced, strategies.length);

  const linearGradients = strategies.map((strategy, index) =>
    generateGradient(palette, context, strategy, {
      colorPair: colorPairs[index],
    }),
  );

  // Add mesh and aurora gradients for 6 total options
  const meshGradient = generateMeshGradient(palette, enhanced);
  const auroraGradient = generateAuroraGradient(palette, enhanced);

  return [...linearGradients, meshGradient, auroraGradient];
}
