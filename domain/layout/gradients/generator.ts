import { AspectCategory } from "../aspect";
import { AdvancedGradient, GradientStop, GradientType } from "./types";
import { ColorPalette } from "@/domain/asset/types";
import { enhanceColorPalette, EnhancedColorPalette, enhanceColor } from "./colors";

type GradientVariation = {
  colorPair?: [string, string];
  backgroundShift?: number;
  backgroundSeed?: string;
};

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
  const { aspectCategory, templateVariant } = context;

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

const BACKGROUND_GRADIENT_COLORS = [
  "#050816",
  "#070B1E",
  "#0B1120",
  "#0F172A",
  "#111827",
  "#13141F",
  "#111536",
  "#161A42",
  "#1A1E3A",
  "#1F243B",
];

/**
 * Generate three color stops: two most prominent screenshot colors + an ambient background color
 */
function generateGradientStops(
  palette: EnhancedColorPalette,
  strategy: "hero-base" | "multi-color" | "complementary" | "analogous" | "triadic" = "multi-color",
  variation?: GradientVariation,
): GradientStop[] {
  const [primary, secondary] = variation?.colorPair ?? getProminentScreenshotColors(palette);
  const seed = variation?.backgroundSeed ?? `${primary}-${secondary}-${strategy}`;
  const background = getBackgroundAccentColor(
    seed,
    primary,
    secondary,
    strategy,
    variation?.backgroundShift ?? 0,
  );

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

  return [
    { color: start, position: 0 },
    { color: background, position: 50 },
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
 * Choose a background color from a curated list so it is not tied to the screenshot palette
 */
function getBackgroundAccentColor(
  seed: string,
  primary: string,
  secondary: string,
  strategy: string,
  additionalShift = 0,
): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const strategyOffset: Record<string, number> = {
    "hero-base": 0,
    "multi-color": 1,
    complementary: 2,
    analogous: 3,
    triadic: 4,
  };

  const offset = strategyOffset[strategy] ?? 0;
  let index = (hash + offset + additionalShift) % BACKGROUND_GRADIENT_COLORS.length;
  let picked = BACKGROUND_GRADIENT_COLORS[index];
  let attempts = 0;
  const lowerPrimary = primary.toLowerCase();
  const lowerSecondary = secondary.toLowerCase();

  while (
    (picked.toLowerCase() === lowerPrimary || picked.toLowerCase() === lowerSecondary) &&
    attempts < BACKGROUND_GRADIENT_COLORS.length
  ) {
    attempts += 1;
    index = (index + 1) % BACKGROUND_GRADIENT_COLORS.length;
    picked = BACKGROUND_GRADIENT_COLORS[index];
  }

  return picked;
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

function buildColorPairs(palette: EnhancedColorPalette, count: number): [string, string][] {
  const pool = getPaletteColorPool(palette);
  const pairs: [string, string][] = [];

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
 * Generate multiple gradient options from a palette
 * Used in gradient picker to show different variations
 * Each option uses a different color strategy for maximum visual variety
 */
export function generateGradientOptions(
  palette: ColorPalette,
  context: GradientContext,
): AdvancedGradient[] {
  const enhanced = enhanceColorPalette(palette);
  const strategies: Array<"multi-color" | "complementary" | "analogous" | "triadic"> = [
    "multi-color",
    "complementary",
    "analogous",
    "triadic",
  ];

  const colorPairs = buildColorPairs(enhanced, strategies.length);

  return strategies.map((strategy, index) =>
    generateGradient(palette, context, strategy, {
      colorPair: colorPairs[index],
      backgroundShift: index,
      backgroundSeed: `${colorPairs[index][0]}-${colorPairs[index][1]}-${strategy}-${index}`,
    }),
  );
}
