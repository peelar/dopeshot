import { CustomGradient, LayoutConfig } from "./types";
import { isAdvancedGradient, isLegacyGradient } from "./gradients";

export function getPreferredGradientAngle(config: LayoutConfig): number | undefined {
  const variant = config.variant?.toLowerCase();
  if (!variant) {
    return undefined;
  }
  if (variant.includes("left")) {
    return 300;
  }
  if (variant.includes("right")) {
    return 120;
  }
  if (variant.includes("center")) {
    return 180;
  }
  return undefined;
}

export function applyPreferredAngle(gradient: CustomGradient, angle?: number): CustomGradient {
  if (angle === undefined) {
    return gradient;
  }
  if (isAdvancedGradient(gradient)) {
    return { ...gradient, angle };
  }
  if (isLegacyGradient(gradient)) {
    return { ...gradient, direction: `${angle}deg` };
  }
  return gradient;
}

export function getGradientColorsForContrast(gradient: CustomGradient): string[] {
  if (isAdvancedGradient(gradient)) {
    return gradient.stops
      .map((stop) => stop?.color)
      .filter((color): color is string => Boolean(color));
  }
  if (isLegacyGradient(gradient)) {
    return [gradient.from, gradient.to].filter((color): color is string => Boolean(color));
  }
  return [];
}





