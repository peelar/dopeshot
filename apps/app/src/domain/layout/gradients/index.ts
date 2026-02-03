/**
 * Gradient module - centralized gradient logic
 *
 * This module contains all gradient-related functionality:
 * - Types and type guards
 * - Palette-matched gradients
 * - CSS rendering utilities
 */

// Types
export type {
  GradientStop,
  GradientType,
  GradientColorSpace,
  AdvancedGradient,
  LegacyGradient,
  CustomGradient,
  MeshLayer,
} from "./types";

export { isLegacyGradient, isAdvancedGradient, isMeshGradient, isAuroraGradient } from "./types";

export type { HueBucket, Brightness, AccentStrength, ColorSignature, GradientPalette } from "./palette";
export { buildGradientPalette } from "./palette";

// Gradient generation (palette-matched)
export { generateGradientOptions } from "./generator";

// Utilities
export {
  getContrastTextColor,
  getContrastTextColorFromPalette,
  customGradientToCss,
  directionStringToDegrees,
  hexToRgba,
} from "./utils";
