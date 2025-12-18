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
 * Create a 2-stop preset gradient for smooth color transitions.
 */
function createPresetGradient(
  colors: { start: string; end: string },
  angle = 90,
): AdvancedGradient {
  return {
    type: "linear",
    stops: [
      { color: colors.start, position: 0 },
      { color: colors.end, position: 100 },
    ],
    angle,
    colorSpace: "oklch",
  };
}

export const GRADIENTS: GradientPreset[] = [
  {
    id: "hyper",
    name: "Hyper",
    gradient: createPresetGradient({
      start: "#ec4899",
      end: "#8b5cf6",
    }),
    textColor: "slate-50",
  },
  {
    id: "oceanic",
    name: "Oceanic",
    gradient: createPresetGradient({
      start: "#2E3192",
      end: "#1BFFFF",
    }),
    textColor: "slate-50",
  },
  {
    id: "cotton-candy",
    name: "Cotton Candy",
    gradient: createPresetGradient({
      start: "#D4145A",
      end: "#FBB03B",
    }),
    textColor: "slate-900",
  },
  {
    id: "sunset",
    name: "Sunset",
    gradient: createPresetGradient({
      start: "#ff7e5f",
      end: "#feb47b",
    }),
    textColor: "slate-900",
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    gradient: createPresetGradient({
      start: "#43cea2",
      end: "#185a9d",
    }),
    textColor: "slate-50",
  },
  {
    id: "midnight",
    name: "Midnight",
    gradient: createPresetGradient({
      start: "#232526",
      end: "#414345",
    }),
    textColor: "slate-50",
  },
  {
    id: "lush",
    name: "Lush",
    gradient: createPresetGradient({
      start: "#56ab2f",
      end: "#a8e063",
    }),
    textColor: "slate-900",
  },
  {
    id: "frost",
    name: "Frost",
    gradient: createPresetGradient({
      start: "#000428",
      end: "#004e92",
    }),
    textColor: "slate-50",
  },
];

export function getGradientById(id: string): GradientPreset | undefined {
  return GRADIENTS.find((g) => g.id === id);
}

export const DEFAULT_GRADIENT = GRADIENTS[0];
