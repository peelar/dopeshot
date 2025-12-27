import type { LayoutConfig, PatternChoice } from "./types";

/**
 * Resolve the pattern to render.
 * Grain texture is always enabled for gradient backgrounds.
 */
export function resolvePatternChoice(config: LayoutConfig): PatternChoice {
  const bg = config.background;

  // No overlay on background images
  if (bg?.type === "image") return "none";

  // Always grain for gradients and solid colors
  return "grain";
}
