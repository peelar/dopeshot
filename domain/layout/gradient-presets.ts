import { ColorToken } from "./types";
import { AdvancedGradient } from "./gradients/types";
import { customGradientToCss } from "./gradients";

export interface GradientPreset {
  id: string;
  name: string;
  gradient: AdvancedGradient; // Multi-color gradient using new system
  textColor: ColorToken;
}

/**
 * Create a beautiful 3+ color gradient from color stops
 */
function createPresetGradient(
  stops: Array<{ color: string; position: number }>,
  angle = 90,
): AdvancedGradient {
  return {
    type: "linear",
    stops: stops.map((s) => ({ color: s.color, position: s.position })),
    angle,
    colorSpace: "oklch",
  };
}

export const GRADIENTS: GradientPreset[] = [
  {
    id: "hyper",
    name: "Hyper",
    gradient: createPresetGradient(
      [
        { color: "#ec4899", position: 0 },
        { color: "#d946ef", position: 40 },
        { color: "#8b5cf6", position: 100 },
      ],
      90,
    ),
    textColor: "slate-50",
  },
  {
    id: "oceanic",
    name: "Oceanic",
    gradient: createPresetGradient(
      [
        { color: "#2E3192", position: 0 },
        { color: "#1B73E8", position: 50 },
        { color: "#1BFFFF", position: 100 },
      ],
      90,
    ),
    textColor: "slate-50",
  },
  {
    id: "cotton-candy",
    name: "Cotton Candy",
    gradient: createPresetGradient(
      [
        { color: "#D4145A", position: 0 },
        { color: "#FF6B9D", position: 50 },
        { color: "#FBB03B", position: 100 },
      ],
      90,
    ),
    textColor: "slate-900",
  },
  {
    id: "sunset",
    name: "Sunset",
    gradient: createPresetGradient(
      [
        { color: "#ff7e5f", position: 0 },
        { color: "#ff9a56", position: 40 },
        { color: "#feb47b", position: 100 },
      ],
      90,
    ),
    textColor: "slate-900",
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    gradient: createPresetGradient(
      [
        { color: "#43cea2", position: 0 },
        { color: "#38a169", position: 40 },
        { color: "#185a9d", position: 100 },
      ],
      90,
    ),
    textColor: "slate-50",
  },
  {
    id: "midnight",
    name: "Midnight",
    gradient: createPresetGradient(
      [
        { color: "#232526", position: 0 },
        { color: "#2d2f31", position: 50 },
        { color: "#414345", position: 100 },
      ],
      90,
    ),
    textColor: "slate-50",
  },
  {
    id: "lush",
    name: "Lush",
    gradient: createPresetGradient(
      [
        { color: "#56ab2f", position: 0 },
        { color: "#7bc043", position: 50 },
        { color: "#a8e063", position: 100 },
      ],
      90,
    ),
    textColor: "slate-900",
  },
  {
    id: "frost",
    name: "Frost",
    gradient: createPresetGradient(
      [
        { color: "#000428", position: 0 },
        { color: "#002856", position: 50 },
        { color: "#004e92", position: 100 },
      ],
      90,
    ),
    textColor: "slate-50",
  },
];

export function getGradientById(id: string): GradientPreset | undefined {
  return GRADIENTS.find((g) => g.id === id);
}

/**
 * Get CSS string for a preset gradient (for backward compatibility)
 */
export function getPresetGradientCss(id: string): string | undefined {
  const preset = getGradientById(id);
  return preset ? customGradientToCss(preset.gradient) : undefined;
}

export const DEFAULT_GRADIENT = GRADIENTS[0];
