import { AspectCategory } from "../aspect";
import { AdvancedGradient, GradientStop, GradientType, MeshLayer } from "./types";
import { ColorPalette } from "@/domain/asset/types";
import {
  enhanceColorPalette,
  EnhancedColorPalette,
  enhanceColor,
  enforceColorSeparation,
  generateHarmonyColor,
  generateNeonColor,
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
  const { type, direction, angle: baseAngle } = getGradientGeometry(context);

  // Vary angle based on strategy to create visual distinction
  // Use more dramatic angle differences to make gradients visually distinct
  let angle = baseAngle;
  if (type === "linear" && angle !== undefined) {
    const angleVariations: Record<string, number> = {
      "multi-color": 0, // Keep original angle
      complementary: 135, // Diagonal opposite direction
      analogous: -60, // Different diagonal
      triadic: 45, // Another diagonal
      "hero-base": 0,
    };
    const variation = angleVariations[strategy] ?? 0;
    angle = (angle + variation + 360) % 360;
  }

  // Generate color stops from screenshot colors
  const stops = generateGradientStops(enhanced, strategy, variation);

  return {
    type,
    stops,
    direction,
    angle,
    colorSpace: "oklab", // Use Oklab for smooth perceptual interpolation
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
 */
function generateGradientStops(
  palette: EnhancedColorPalette,
  strategy: "hero-base" | "multi-color" | "complementary" | "analogous" | "triadic" = "multi-color",
  variation?: GradientVariation,
): GradientStop[] {
  const [rawPrimary, rawSecondary] = variation?.colorPair ?? getProminentScreenshotColors(palette);

  // Use screenshot colors directly
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
 *
 * Slots 1-3 are linear gradients and should each have DISTINCT color harmonies
 * to ensure visual variety even with limited source colors.
 */
function buildColorPairs(palette: EnhancedColorPalette, count: number): [string, string][] {
  const pool = getPaletteColorPool(palette);
  const pairs: [string, string][] = [];

  // Detect if the palette is effectively monochromatic
  const isMonochromatic = isPoolMonochromatic(pool);

  if (isMonochromatic && pool.length > 0) {
    // Use the hero color (most prominent/saturated) as the base
    const baseColor = palette.hero ?? pool[0];

    // Generate distinct gradient pairs using color theory harmonies.
    // ALL pairs use different hue rotations to ensure visual variety.
    // This is crucial for dark/monochromatic screenshots where all gradients
    // would otherwise look the same.
    for (let i = 0; i < count; i++) {
      switch (i) {
        case 0:
          // Pair 0: Analogous warm (30° hue rotation) - subtle but distinct shift
          pairs.push([
            baseColor,
            generateHarmonyColor(baseColor, "analogous", 0),
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
          // Pair 2: Split-complementary (150° hue rotation) - sophisticated contrast
          pairs.push([
            baseColor,
            generateHarmonyColor(baseColor, "split-complementary", 0),
          ]);
          break;
        case 3:
          // Pair 3: Triadic (120° hue rotation) - vibrant contrast
          pairs.push([
            baseColor,
            generateHarmonyColor(baseColor, "triadic", 0),
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
 * Generate a vibrant neon color palette for mesh gradients.
 * Creates 6 electric, eye-catching colors spread across the color wheel.
 * Each color is pushed to maximum saturation for a bold, neon aesthetic.
 *
 * @param baseColor - The primary color extracted from the screenshot
 * @returns Array of 6 neon hex colors with wide hue distribution
 */
function generateNeonMeshPalette(baseColor: string): string[] {
  // Hue offsets designed for maximum visual variety
  // Spread across 240°+ of the color wheel for rainbow effect
  const hueOffsets = [
    0,    // Original hue (neon version)
    180,  // Complementary (opposite on wheel)
    60,   // Warm analogous
    120,  // Triadic
    -60,  // Cool analogous (300° = -60°)
    240,  // Second triadic
  ];

  return hueOffsets.map(offset => generateNeonColor(baseColor, offset));
}

/**
 * Check if a color pool has limited variety (needs neon enhancement).
 * Returns true if there are fewer than 4 distinct hues.
 */
function needsNeonEnhancement(colors: string[]): boolean {
  if (colors.length < 4) return true;
  return isPoolMonochromatic(colors);
}

/**
 * Generate mesh gradient with multiple organic blob layers.
 * Mesh gradients are FUNDAMENTALLY different from linear gradients.
 * This creates a rich, multi-color blob effect that's distinct from linear gradients.
 */
function generateMeshGradient(
  enhanced: EnhancedColorPalette,
): AdvancedGradient {
  const colors = getPaletteColorPool(enhanced);
  const baseColor = enhanced.hero ?? colors[0];

  let meshColors: string[];

  if (needsNeonEnhancement(colors)) {
    meshColors = generateNeonMeshPalette(baseColor);
  } else {
    meshColors = colors.slice(0, 6).map((color, i) =>
      generateNeonColor(color, i * 15)
    );
    while (meshColors.length < 6) {
      meshColors.push(generateNeonColor(baseColor, meshColors.length * 60));
    }
  }

  const opacities = [0.75, 0.70, 0.60, 0.55, 0.50, 0.45];

  const meshLayers: MeshLayer[] = [
    { color: hexToRgba(meshColors[0], opacities[0]), position: { x: 15, y: 20 }, size: 70 },
    { color: hexToRgba(meshColors[1], opacities[1]), position: { x: 85, y: 80 }, size: 75 },
    { color: hexToRgba(meshColors[2], opacities[2]), position: { x: 50, y: 50 }, size: 90 },
    { color: hexToRgba(meshColors[3], opacities[3]), position: { x: 80, y: 25 }, size: 65 },
    { color: hexToRgba(meshColors[4], opacities[4]), position: { x: 20, y: 75 }, size: 60 },
    { color: hexToRgba(meshColors[5], opacities[5]), position: { x: 45, y: 30 }, size: 55 },
  ];

  return {
    type: "linear",
    stops: [
      { color: meshColors[0], position: 0 },
      { color: meshColors[1], position: 100 },
    ],
    meshLayers,
    colorSpace: "oklab",
  };
}

/**
 * Generate an ambient gradient from screenshot colors.
 * These are "safe" gradients that always have two distinct colors.
 * Provides one dark and one light option.
 */
function generateAmbientGradient(
  enhanced: EnhancedColorPalette,
  slot: "first" | "second",
): AdvancedGradient {
  const accentColor = enhanced.vibrant ?? enhanced.accent ?? enhanced.hero ?? enhanced.dominant;

  // Provide one dark and one light option
  const mode = slot === "first" ? "dark" : "light";

  if (mode === "dark") {
    const darkAccent = enhanceColor(accentColor, {
      lightnessShift: -0.7,
      saturationBoost: 0.4,
    });

    return {
      type: "linear",
      stops: [
        { color: "#000000", position: 0 },
        { color: darkAccent, position: 100 },
      ],
      angle: 135,
      colorSpace: "oklab",
    };
  } else {
    const lightAccent = enhanceColor(accentColor, {
      lightnessShift: 0.6,
      saturationBoost: 0.3,
    });

    return {
      type: "linear",
      stops: [
        { color: "#ffffff", position: 0 },
        { color: lightAccent, position: 100 },
      ],
      angle: 135,
      colorSpace: "oklab",
    };
  }
}

/**
 * Generate multiple gradient options from a palette.
 * 
 * Slot layout:
 * 1-3: Linear gradients (multi-color, complementary, analogous)
 * 4: Mesh gradient (neon blob layers)
 * 5: Dark ambient (black → dark accent)
 * 6: Light ambient (white → light accent)
 */
export function generateGradientOptions(
  palette: ColorPalette,
  context: GradientContext,
): AdvancedGradient[] {
  const enhanced = enhanceColorPalette(palette);

  // 3 linear gradient strategies
  const strategies: Array<"multi-color" | "complementary" | "analogous"> = [
    "multi-color",
    "complementary",
    "analogous",
  ];

  const colorPairs = buildColorPairs(enhanced, strategies.length);

  const linearGradients = strategies.map((strategy, index) =>
    generateGradient(palette, context, strategy, {
      colorPair: colorPairs[index],
    }),
  );

  // Slot 4: Mesh gradient
  const meshGradient = generateMeshGradient(enhanced);

  // Slots 5-6: Ambient gradients (one dark, one light)
  const ambient1 = generateAmbientGradient(enhanced, "first");
  const ambient2 = generateAmbientGradient(enhanced, "second");

  return [...linearGradients, meshGradient, ambient1, ambient2];
}
