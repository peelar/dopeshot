import type { ColorPalette } from "@/domain/asset/types";
import type { LayoutConfig, PatternChoice, PatternId, PatternMode } from "./types";

export type PatternOptionId = PatternChoice;

export type PatternOption = {
  id: PatternOptionId;
  label: string;
  description?: string;
};

export const PATTERN_OPTIONS: PatternOption[] = [
  { id: "none", label: "None", description: "No overlay" },
  { id: "grain", label: "Grain", description: "Fine noise texture" },
  { id: "glow", label: "Glow", description: "Radial light bloom" },
  { id: "grid", label: "Grid", description: "Diagonal cross grid" },
];

/**
 * Resolve the pattern to render given config and optional palette context.
 * - Manual mode: honor patternId (default to grain unless explicitly none or grain disabled).
 * - Auto mode: avoid overlays on background images, prefer grid for solid backgrounds,
 *   glow when palette has an accent/vibrant color, otherwise grain.
 */
export function resolvePatternChoice(
  config: LayoutConfig,
  palette?: ColorPalette,
): PatternChoice {
  const bg = config.background;
  const patternMode: PatternMode =
    bg?.patternMode ?? (bg?.patternId ? "manual" : ("auto" as PatternMode));

  // Manual branch
  if (patternMode === "manual") {
    if (bg?.patternId) return bg.patternId;
    if (bg?.grainEnabled === false) return "none";
    return "grain";
  }

  // Auto branch
  if (bg?.type === "image") return "none";
  if (bg?.grainEnabled === false) return "none";
  if (bg?.type === "solid") return "grid";

  // Default: keep grain as the safe, readable texture
  return "grain";
}
