import { ColorToken, CustomGradient } from "./types";

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
/**
 * Convert CustomGradient to CSS gradient string
 */
export function customGradientToCss(gradient: CustomGradient): string {
  const direction = gradient.direction ?? "to right";
  return `linear-gradient(${direction}, ${gradient.from}, ${gradient.to})`;
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
