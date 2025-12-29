/**
 * Gradient Data Models
 * 
 * This module defines the shape of gradient data used throughout layouts.
 * It does NOT contain generation/extraction logic - see domain/gradient-generation.
 * 
 * Purpose: Pure data types and type guards for gradient configurations
 * Layer: Domain Model (data structures only)
 * Dependencies: None
 */

/**
 * Color stop in a gradient with optional position (0-100% or 0-1)
 */
export type GradientStop = {
  color: string; // hex color
  position?: number; // 0-100 for percentage, or 0-1 for normalized
};

/**
 * A single radial blob layer for mesh gradients
 * Creates organic, fluid shapes when multiple layers are overlaid
 */
export type MeshLayer = {
  color: string; // rgba color string for transparency support
  position: {
    x: number; // 0-100 percentage horizontal position
    y: number; // 0-100 percentage vertical position
  };
  size: number; // Percentage of container (e.g., 70 for 70%)
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
  stops: GradientStop[]; // Color stops with positions
  direction?: string; // e.g., "to right", "45deg", "circle at center"
  colorSpace?: GradientColorSpace; // defaults to "oklch" for perceptual uniformity
  angle?: number; // for linear gradients in degrees (0-360)
  meshLayers?: MeshLayer[]; // For mesh gradients - overlaid radial blob layers
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

/**
 * Type guard to check if gradient is a mesh gradient (has meshLayers)
 */
export function isMeshGradient(gradient: CustomGradient): boolean {
  return (
    isAdvancedGradient(gradient) &&
    gradient.meshLayers !== undefined &&
    gradient.meshLayers.length > 0
  );
}

/**
 * Type guard to check if gradient is an aurora gradient
 * Aurora gradients are linear with 4+ stops for flowing wave effect
 */
export function isAuroraGradient(gradient: CustomGradient): boolean {
  return (
    isAdvancedGradient(gradient) &&
    gradient.type === "linear" &&
    gradient.stops.length >= 4 &&
    !gradient.meshLayers
  );
}




