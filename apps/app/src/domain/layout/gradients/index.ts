/**
 * Gradient module - centralized gradient logic
 *
 * This module contains all gradient-related functionality:
 * - Types and type guards
 * - Color space conversion and palette enhancement
 * - Gradient generation algorithms
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
} from "./types";

export { isLegacyGradient, isAdvancedGradient } from "./types";

// Color space and palette enhancement
export type { EnhancedColorPalette } from "./colors";

// Gradient generation
export type { GradientContext } from "./generator";
export { generateGradientOptions } from "./generator";

// Utilities
export { getContrastTextColor, customGradientToCss, directionStringToDegrees } from "./utils";
