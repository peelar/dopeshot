/**
 * Gradient Generator - Static Placeholder Gradients
 *
 * Provides 6 curated placeholder gradients until the palette-based
 * gradient system is implemented.
 *
 * TODO: Replace with palette-matching system per plan in
 * thoughts/plans/09-palette-based-gradient-system.md
 */

import { AdvancedGradient, MeshLayer } from "./types";
import { hexToRgba } from "./utils";

/**
 * 6 static placeholder gradients - curated to look good
 * These will be replaced by palette-matched gradients
 */
const PLACEHOLDER_GRADIENTS: AdvancedGradient[] = [
  // 1. Mesh gradient - purple/pink/blue organic blobs
  {
    type: "linear",
    stops: [
      { color: "#7c3aed", position: 0 },
      { color: "#db2777", position: 100 },
    ],
    meshLayers: [
      { color: hexToRgba("#7c3aed", 0.8), position: { x: 10, y: 15 }, size: 75 },
      { color: hexToRgba("#db2777", 0.7), position: { x: 90, y: 85 }, size: 80 },
      { color: hexToRgba("#6366f1", 0.65), position: { x: 50, y: 50 }, size: 95 },
      { color: hexToRgba("#ec4899", 0.6), position: { x: 85, y: 20 }, size: 65 },
      { color: hexToRgba("#8b5cf6", 0.55), position: { x: 15, y: 80 }, size: 70 },
      { color: hexToRgba("#a855f7", 0.5), position: { x: 40, y: 25 }, size: 60 },
    ],
    colorSpace: "oklch",
  },

  // 2. Linear diagonal - indigo to purple
  {
    type: "linear",
    stops: [
      { color: "#6366f1", position: 0 },
      { color: "#a855f7", position: 100 },
    ],
    angle: 135,
    colorSpace: "oklch",
  },

  // 3. Radial - teal center fading to blue
  {
    type: "radial",
    stops: [
      { color: "#14b8a6", position: 0 },
      { color: "#3b82f6", position: 100 },
    ],
    direction: "circle at 50% 50%",
    colorSpace: "oklch",
  },

  // 4. Multi-stop diagonal - sunset orange/pink/purple
  {
    type: "linear",
    stops: [
      { color: "#f97316", position: 0 },
      { color: "#ec4899", position: 50 },
      { color: "#8b5cf6", position: 100 },
    ],
    angle: 135,
    colorSpace: "oklch",
  },

  // 5. Linear cool - cyan to indigo
  {
    type: "linear",
    stops: [
      { color: "#22d3ee", position: 0 },
      { color: "#6366f1", position: 100 },
    ],
    angle: 225,
    colorSpace: "oklch",
  },

  // 6. Linear warm - orange to rose
  {
    type: "linear",
    stops: [
      { color: "#fb923c", position: 0 },
      { color: "#f43f5e", position: 100 },
    ],
    angle: 135,
    colorSpace: "oklch",
  },
];

/**
 * Returns 6 static placeholder gradients
 *
 * @deprecated This will be replaced by palette-matched gradients
 */
export function generateGradientOptions(): AdvancedGradient[] {
  return PLACEHOLDER_GRADIENTS;
}
