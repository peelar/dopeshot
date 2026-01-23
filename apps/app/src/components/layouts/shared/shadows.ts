import { ShadowIntensity } from "@/domain/layout/types";
import type { PersonalityShadow } from "@/domain/brand/personality-mapping";

const SHADOW_PRESETS: Record<ShadowIntensity, string> = {
  low: "0 2px 8px rgba(0, 0, 0, 0.08)",
  medium: "0 4px 16px rgba(0, 0, 0, 0.15)",
  high: "0 12px 40px rgba(0, 0, 0, 0.3)",
};

export function getShadowValue(intensity?: ShadowIntensity) {
  return SHADOW_PRESETS[intensity || "medium"];
}

/**
 * Build a CSS box-shadow string from a PersonalityShadow configuration.
 * Supports both standard shadows and tinted/colored shadows for
 * warm or glowing effects.
 */
export function buildShadowFromStyle(shadow: PersonalityShadow): string {
  const { blur, spread, offsetY, opacity, tint } = shadow;

  // If no shadow (all zeros), return none
  if (blur === 0 && spread === 0 && offsetY === 0 && opacity === 0) {
    return "none";
  }

  // Build the base shadow color
  const baseColor = `rgba(0, 0, 0, ${opacity})`;

  // If there's a tint, we create a layered shadow:
  // 1. The tinted glow/warmth layer
  // 2. The base shadow for depth
  if (tint) {
    return `0 ${offsetY}px ${blur}px ${spread}px ${tint}, 0 ${offsetY}px ${Math.round(blur * 0.5)}px ${spread}px ${baseColor}`;
  }

  return `0 ${offsetY}px ${blur}px ${spread}px ${baseColor}`;
}
