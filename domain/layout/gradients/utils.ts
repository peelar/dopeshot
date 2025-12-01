import { ColorToken } from "../types";
import { CustomGradient, isLegacyGradient, isAdvancedGradient, GradientColorSpace } from "./types";

const COLOR_SPACE_SUPPORT_CACHE: Partial<Record<GradientColorSpace, boolean>> = {};

function isColorSpaceSupported(space?: GradientColorSpace): boolean {
  if (!space || space === "srgb") {
    return false;
  }

  const cached = COLOR_SPACE_SUPPORT_CACHE[space];
  if (cached !== undefined) {
    return cached;
  }

  if (
    typeof window === "undefined" ||
    typeof CSS === "undefined" ||
    typeof CSS.supports !== "function"
  ) {
    COLOR_SPACE_SUPPORT_CACHE[space] = false;
    return false;
  }

  const testDeclaration = `linear-gradient(in ${space} 90deg, #000, #fff)`;
  const supported = CSS.supports("background-image", testDeclaration);
  COLOR_SPACE_SUPPORT_CACHE[space] = supported;
  return supported;
}

function buildGradientArgs(base: string, space?: GradientColorSpace): string {
  const supportsSpace = isColorSpaceSupported(space);
  if (supportsSpace && space) {
    return `in ${space} ${base}`.trim();
  }
  return base.trim();
}

/**
 * Calculate relative luminance of a hex color
 * Used to determine if text should be light or dark
 */
function normalizeHex(hex: string): string {
  if (!hex) {
    return "#000000";
  }
  return hex.startsWith("#") ? hex : `#${hex}`;
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(normalizeHex(hex));
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Determine if a color is considered "dark"
 */
function contrastRatio(colorA: string, colorB: string): number {
  const luminanceA = getLuminance(colorA) + 0.05;
  const luminanceB = getLuminance(colorB) + 0.05;
  return luminanceA > luminanceB ? luminanceA / luminanceB : luminanceB / luminanceA;
}

const LIGHT_TEXT_HEX = "#f8fafc"; // slate-50
const DARK_TEXT_HEX = "#0f172a"; // slate-900

/**
 * Get appropriate text color token based on one or more background colors
 */
export function getContrastTextColor(backgroundColor: string | string[]): ColorToken {
  const palette = Array.isArray(backgroundColor) ? backgroundColor : [backgroundColor];
  let weakestLightContrast = Infinity;
  let weakestDarkContrast = Infinity;

  for (const color of palette) {
    const normalized = normalizeHex(color);
    weakestLightContrast = Math.min(
      weakestLightContrast,
      contrastRatio(normalized, LIGHT_TEXT_HEX),
    );
    weakestDarkContrast = Math.min(weakestDarkContrast, contrastRatio(normalized, DARK_TEXT_HEX));
  }

  // Favor light text if it maintains at least slightly better contrast; default to dark otherwise
  if (weakestLightContrast >= weakestDarkContrast) {
    return "slate-50";
  }
  return "slate-900";
}

/**
 * Convert CustomGradient to CSS gradient string
 * Supports both legacy 2-color and advanced multi-stop gradients
 */
export function customGradientToCss(gradient: CustomGradient): string {
  // Handle legacy 2-color gradients (backward compatible)
  if (isLegacyGradient(gradient)) {
    const direction = gradient.direction ?? "to right";
    return `linear-gradient(${direction}, ${gradient.from}, ${gradient.to})`;
  }

  // Handle advanced multi-stop gradients
  if (isAdvancedGradient(gradient)) {
    const { type, stops, direction, colorSpace, angle } = gradient;

    const directionOrAngle = angle !== undefined ? `${angle}deg` : (direction ?? "to right");
    const directionWithSpace = buildGradientArgs(directionOrAngle, colorSpace);

    // Build stops string
    const stopsString = stops
      .map((stop) => {
        if (stop.position !== undefined) {
          // Normalize position (if 0-1, convert to percentage)
          const position = stop.position <= 1 ? `${stop.position * 100}%` : `${stop.position}%`;
          return `${stop.color} ${position}`;
        }
        return stop.color;
      })
      .join(", ");

    // Build gradient type and direction
    let gradientFunction = "";

    if (type === "radial") {
      const radialDirection = buildGradientArgs(direction ?? "circle at center", colorSpace);
      gradientFunction = `radial-gradient(${radialDirection}, ${stopsString})`;
    } else if (type === "conic") {
      const conicDirection = buildGradientArgs(direction ?? "from 0deg at center", colorSpace);
      gradientFunction = `conic-gradient(${conicDirection}, ${stopsString})`;
    } else {
      gradientFunction = `linear-gradient(${directionWithSpace}, ${stopsString})`;
    }

    return gradientFunction;
  }

  // Fallback (should not reach here with proper types)
  return "linear-gradient(to right, #6366f1, #8b5cf6)";
}

const DIRECTION_KEYWORD_ANGLE: Record<string, number> = {
  "to top": 0,
  "to top right": 45,
  "to right": 90,
  "to bottom right": 135,
  "to bottom": 180,
  "to bottom left": 225,
  "to left": 270,
  "to top left": 315,
};

function normalizeKeyword(direction: string): string {
  return direction.trim().toLowerCase().replace(/\s+/g, " ");
}

export function directionStringToDegrees(direction?: string): number {
  if (!direction) return 90;

  const normalized = normalizeKeyword(direction);
  if (normalized.endsWith("deg")) {
    const parsed = parseFloat(normalized.replace("deg", ""));
    if (!Number.isNaN(parsed)) {
      return ((parsed % 360) + 360) % 360;
    }
  }

  return DIRECTION_KEYWORD_ANGLE[normalized] ?? 90;
}
