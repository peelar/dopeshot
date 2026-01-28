import type { LayoutConfig } from "./types";

export type FadeDirection = "to-top" | "to-bottom" | "to-left" | "to-right";

const cssDirectionMap: Record<FadeDirection, string> = {
  "to-top": "to top",
  "to-bottom": "to bottom",
  "to-left": "to left",
  "to-right": "to right",
};

/**
 * Infer a sensible fade direction from the current layout/variant.
 * Peak center fades upward, Peak left fades horizontally to the right,
 * Peak right fades horizontally to the left. All other layouts default to bottom.
 */
export function inferFadeDirection(config: Pick<LayoutConfig, "layoutId" | "variant">): FadeDirection {
  const variant = (config.variant as "left" | "right" | "center" | undefined) ?? "center";

  if (config.layoutId.startsWith("popup-gradient")) {
    if (variant === "center") return "to-top";
    if (variant === "left") return "to-right";
    return "to-left"; // right placement fades back toward the left
  }

  return "to-bottom";
}

export function fadeDirectionToCss(direction: FadeDirection): string {
  return cssDirectionMap[direction];
}

export function getFadeMaskGradient(direction: FadeDirection): string {
  const cssDirection = fadeDirectionToCss(direction);
  const isHorizontal = direction === "to-left" || direction === "to-right";
  // Horizontal fades: keep origin fully visible, fade toward the far edge
  const startOpacity = isHorizontal ? 1 : 0.05;
  const endOpacity = isHorizontal ? 0.3 : 1;
  // Use white so luminance stays high (visible) and only opacity controls fade
  return `linear-gradient(${cssDirection}, rgba(255,255,255,${startOpacity}) 0%, rgba(255,255,255,${endOpacity}) 100%)`;
}
