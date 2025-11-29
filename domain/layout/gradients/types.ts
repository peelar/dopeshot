/**
 * Color stop in a gradient with optional position (0-100% or 0-1)
 */
export type GradientStop = {
  color: string; // hex color
  position?: number; // 0-100 for percentage, or 0-1 for normalized
};

/**
 * Gradient type - linear, radial, or conic
 */
export type GradientType = "linear" | "radial" | "conic";

/**
 * Color space for gradient interpolation
 */
export type GradientColorSpace = "oklch" | "srgb" | "lab";

/**
 * Advanced multi-stop gradient configuration
 */
export type AdvancedGradient = {
  type: GradientType;
  stops: GradientStop[]; // 5-12 stops as per PRD
  direction?: string; // e.g., "to right", "45deg", "circle at center"
  colorSpace?: GradientColorSpace; // defaults to "oklch" for perceptual uniformity
  angle?: number; // for linear gradients in degrees (0-360)
};

/**
 * Legacy 2-color gradient (backward compatible)
 */
export type LegacyGradient = {
  from: string; // hex color
  to: string; // hex color
  direction?: string; // e.g., "to right", "to bottom right"
};

/**
 * Unified gradient type supporting both legacy and advanced formats
 */
export type CustomGradient = LegacyGradient | AdvancedGradient;

/**
 * Type guard to check if gradient is legacy format
 */
export function isLegacyGradient(gradient: CustomGradient): gradient is LegacyGradient {
  return "from" in gradient && "to" in gradient && !("stops" in gradient);
}

/**
 * Type guard to check if gradient is advanced format
 */
export function isAdvancedGradient(gradient: CustomGradient): gradient is AdvancedGradient {
  return "stops" in gradient && Array.isArray(gradient.stops);
}

