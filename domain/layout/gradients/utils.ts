import { ColorToken } from "../types";
import { CustomGradient, isLegacyGradient, isAdvancedGradient } from "./types";

/**
 * Calculate relative luminance of a hex color
 * Used to determine if text should be light or dark
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
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
function isColorDark(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

/**
 * Get appropriate text color token based on background color
 */
export function getContrastTextColor(backgroundColor: string): ColorToken {
  return isColorDark(backgroundColor) ? "slate-50" : "slate-900";
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

    // Default color space to OKLCH for perceptual uniformity
    const space = colorSpace ?? "oklch";

    // Build stops string
    const stopsString = stops
      .map((stop) => {
        if (stop.position !== undefined) {
          // Normalize position (if 0-1, convert to percentage)
          const position =
            stop.position <= 1 ? `${stop.position * 100}%` : `${stop.position}%`;
          return `${stop.color} ${position}`;
        }
        return stop.color;
      })
      .join(", ");

    // Build gradient type and direction
    let gradientFunction = "";

    if (type === "radial") {
      const radialDirection = direction ?? "circle at center";
      gradientFunction = `radial-gradient(${radialDirection}, ${stopsString})`;
    } else if (type === "conic") {
      const conicDirection = direction ?? "from 0deg at center";
      gradientFunction = `conic-gradient(${conicDirection}, ${stopsString})`;
    } else {
      // Linear gradient
      let linearDirection = direction ?? "to right";
      if (angle !== undefined) {
        linearDirection = `${angle}deg`;
      }

      // Use OKLCH interpolation syntax if color space is oklch
      if (space === "oklch") {
        gradientFunction = `linear-gradient(${linearDirection} in oklch, ${stopsString})`;
      } else if (space === "lab") {
        gradientFunction = `linear-gradient(${linearDirection} in lab, ${stopsString})`;
      } else {
        gradientFunction = `linear-gradient(${linearDirection}, ${stopsString})`;
      }
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

export function degreesToDirection(angle: number): string {
  const normalized = ((Math.round(angle) % 360) + 360) % 360;
  return `${normalized}deg`;
}

