/**
 * Gradient module - centralized gradient logic
 *
 * This module contains all gradient-related functionality:
 * - Types and type guards
 * - Static placeholder gradients (until palette system is built)
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

// Gradient generation (static placeholders for now)
export { generateGradientOptions } from "./generator";

// Utilities
export {
  getContrastTextColor,
  getContrastTextColorFromPalette,
  customGradientToCss,
  directionStringToDegrees,
  hexToRgba,
} from "./utils";
