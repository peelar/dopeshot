import { FontId, FontSize, FontStyle } from "./types";
import { FONT_STYLE_SCALING_RULES } from "./adaptive-typography";

/**
 * Font Style Definition
 * Each style represents a complete typographic system with semantic meaning
 */
export interface FontStyleDefinition {
  id: FontStyle;
  name: string; // User-facing name (e.g., "Founder", "Billboard")
  fontName: string; // Actual font family name
  foundry: string; // Font creator/source
  cssVariable: string; // CSS variable reference
  description: string; // Brief description of the style's character
}

/**
 * Font Styles for Free Users
 * Four opinionated typographic systems that adapt automatically
 */
export const FONT_STYLES: FontStyleDefinition[] = [
  {
    id: "founder",
    name: "Founder",
    fontName: "Geist Sans",
    foundry: "Vercel",
    cssVariable: "--font-clean",
    description: "Neutral, modern, default",
  },
  {
    id: "billboard",
    name: "Billboard",
    fontName: "Bricolage Grotesque",
    foundry: "Caroline Hadilaksono",
    cssVariable: "--font-bold",
    description: "Bold, expressive, announcement-oriented",
  },
  {
    id: "terminal",
    name: "Terminal",
    fontName: "IBM Plex Mono",
    foundry: "IBM",
    cssVariable: "--font-developer",
    description: "Monospace, technical, tool-like",
  },
];

export const DEFAULT_FONT_STYLE: FontStyle = "founder";

/**
 * Get font style definition by ID
 */
export function getFontStyleById(id: FontStyle): FontStyleDefinition {
  return FONT_STYLES.find((s) => s.id === id) ?? FONT_STYLES[0];
}

/**
 * Get CSS font-family value for a font style
 */
export function getFontStyleCssValue(style: FontStyle): string {
  const fontStyle = getFontStyleById(style);
  return `var(${fontStyle.cssVariable})`;
}

/**
 * Get complete font style configuration including scaling rules
 */
export function getFontStyleDefinition(style: FontStyle) {
  const definition = getFontStyleById(style);
  const scalingRules = FONT_STYLE_SCALING_RULES[style];

  return {
    ...definition,
    scalingRules,
  };
}

// ============================================================================
// LEGACY COMPATIBILITY LAYER
// Keep old font system for backward compatibility during migration
// ============================================================================

export interface FontSizeDefinition {
  id: FontSize;
  label: string;
  titleClass: string;
  subtitleClass: string;
  titleRem: number;
  subtitleRem: number;
}

export const FONT_SIZES: FontSizeDefinition[] = [
  {
    id: "sm",
    label: "S",
    titleClass: "text-3xl",
    subtitleClass: "text-base",
    titleRem: 2.8125,
    subtitleRem: 1.25,
  },
  {
    id: "md",
    label: "M",
    titleClass: "text-4xl",
    subtitleClass: "text-lg",
    titleRem: 3.4375,
    subtitleRem: 1.40625,
  },
  {
    id: "lg",
    label: "L",
    titleClass: "text-5xl",
    subtitleClass: "text-xl",
    titleRem: 4.0625,
    subtitleRem: 1.5625,
  },
  {
    id: "xl",
    label: "XL",
    titleClass: "text-6xl",
    subtitleClass: "text-2xl",
    titleRem: 4.6875,
    subtitleRem: 1.875,
  },
  {
    id: "2xl",
    label: "2XL",
    titleClass: "text-7xl",
    subtitleClass: "text-3xl",
    titleRem: 5.3125,
    subtitleRem: 2.1875,
  },
];

export const DEFAULT_FONT_SIZE: FontSize = "md";

export function getFontSizeById(id: FontSize): FontSizeDefinition {
  return FONT_SIZES.find((s) => s.id === id) ?? FONT_SIZES[1];
}

export interface FontDefinition {
  id: FontId;
  alias: string;
  fontName: string;
  foundry: string;
  cssVariable: string;
}

export const FONTS: FontDefinition[] = [
  {
    id: "clean",
    alias: "Founder",
    fontName: "Geist Sans",
    foundry: "Vercel",
    cssVariable: "--font-clean",
  },
  {
    id: "professional",
    alias: "Civic",
    fontName: "Commissioner",
    foundry: "Google",
    cssVariable: "--font-professional",
  },
  {
    id: "developer",
    alias: "Terminal",
    fontName: "IBM Plex Mono",
    foundry: "IBM",
    cssVariable: "--font-developer",
  },
  {
    id: "bold",
    alias: "Billboard",
    fontName: "Bricolage Grotesque",
    foundry: "Caroline Hadilaksono",
    cssVariable: "--font-bold",
  },
  {
    id: "friendly",
    alias: "Buddy",
    fontName: "Rubik",
    foundry: "Hubert & Fischer",
    cssVariable: "--font-friendly",
  },
  {
    id: "edgy",
    alias: "Edge",
    fontName: "Chivo",
    foundry: "Omnibus-Type",
    cssVariable: "--font-edgy",
  },
  {
    id: "technical",
    alias: "Circuit",
    fontName: "Chakra Petch",
    foundry: "Cadson Demak",
    cssVariable: "--font-technical",
  },
  {
    id: "premium",
    alias: "BlackTie",
    fontName: "Playfair Display",
    foundry: "Claus Eggers Sorensen",
    cssVariable: "--font-premium",
  },
];

export const DEFAULT_FONT_ID: FontId = "clean";

function getFontById(id: FontId): FontDefinition | undefined {
  return FONTS.find((f) => f.id === id);
}

export function getFontCssValue(id: FontId): string {
  const font = getFontById(id);
  return font ? `var(${font.cssVariable})` : "var(--font-clean)";
}

/**
 * Migration helper: Map old FontId to new FontStyle
 */
export function migrateFontIdToStyle(fontId: FontId): FontStyle {
  const mapping: Record<FontId, FontStyle> = {
    clean: "founder",
    bold: "billboard",
    developer: "terminal",
    // Other legacy fonts default to founder
    professional: "founder",
    friendly: "founder",
    edgy: "founder",
    technical: "terminal",
    premium: "founder",
  };

  return mapping[fontId] ?? "founder";
}
