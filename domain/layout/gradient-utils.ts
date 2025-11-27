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
export function isColorDark(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

/**
 * Get appropriate text color token based on background color
 */
export function getContrastTextColor(backgroundColor: string): ColorToken {
  return isColorDark(backgroundColor) ? "slate-50" : "slate-900";
}

/**
 * Generate a gradient from an accent color
 * Pairs with white for light backgrounds, black for dark
 */
export function generateGradientFromAccent(
  accentColor: string,
  preferDarkMode: boolean = false,
): CustomGradient {
  const secondaryColor = preferDarkMode ? "#1e1e1e" : "#ffffff";

  return {
    from: accentColor,
    to: secondaryColor,
    direction: "to right",
  };
}

/**
 * Generate multiple gradient suggestions from a color palette
 */
export function generateGradientSuggestions(
  dominant: string,
  accent: string,
  vibrant?: string,
): CustomGradient[] {
  const suggestions: CustomGradient[] = [
    // Accent to white
    { from: accent, to: "#ffffff", direction: "to right" },
    // Accent to dark
    { from: accent, to: "#1e1e1e", direction: "to right" },
    // Dominant to accent
    { from: dominant, to: accent, direction: "to right" },
  ];

  // Add vibrant-based if available
  if (vibrant) {
    suggestions.push({ from: vibrant, to: "#ffffff", direction: "to right" });
  }

  return suggestions;
}

/**
 * Convert CustomGradient to CSS gradient string
 */
export function customGradientToCss(gradient: CustomGradient): string {
  const direction = gradient.direction ?? "to right";
  return `linear-gradient(${direction}, ${gradient.from}, ${gradient.to})`;
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

