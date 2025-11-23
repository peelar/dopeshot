/**
 * Font System
 *
 * This module provides a font registry system that serves as a thin abstraction
 * over font providers (primarily Google Fonts via next/font/google).
 *
 * Architecture:
 * - Fonts are defined with complete metadata (weights, fallbacks, CSS variables)
 * - Only `fontId` strings appear in LayoutConfig and TextBlockPrimitive
 * - Font resolution (loading, CSS variable injection) happens at render time
 * - This registry is currently static/in-code, but in the future could be:
 *   - Loaded from a database
 *   - Managed via a config file that an LLM can edit
 *   - Extended with custom fonts from URLs or local files
 *
 * LLM Usage:
 * - An LLM can enumerate available fonts via getAllFonts() or getFontsByCategory()
 * - The LLM selects a font by its `id` and writes that `fontId` into LayoutTheme
 *   or TextBlockPrimitive
 * - The LLM can reason about font properties (category, weights, etc.) from
 *   FontDefinition objects to make appropriate choices
 */

// Font source indicates where the font comes from
export type FontSource = "google" | "local" | "customUrl";

// Typographic category for font classification
export type FontCategory = "sans" | "serif" | "mono" | "display";

// CSS font weight values
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

// Complete font definition with all metadata needed for loading and rendering
export type FontDefinition = {
  id: string; // Stable identifier, e.g. "inter", "space-grotesk"
  name: string; // Human-readable name, e.g. "Inter"
  source: FontSource; // Where the font comes from
  category: FontCategory; // Typographic classification
  weights: FontWeight[]; // Available font weights
  defaultWeight: FontWeight; // Default weight to use when not specified
  fallbackStack: string; // CSS fallback stack, e.g. "system-ui, -apple-system, sans-serif"
  cssVariableName: string; // CSS variable name, e.g. "--font-inter"
  importHint?: string; // Textual hint for loading, e.g. "use next/font/google Inter with weights 400,600"
};

// Font registry containing all available fonts
export type FontRegistry = {
  fonts: FontDefinition[];
};

// Static in-code font registry
// In the future, this could be loaded from a database or config file
const fontRegistry: FontRegistry = {
  fonts: [
    {
      id: "inter",
      name: "Inter",
      source: "google",
      category: "sans",
      weights: [400, 500, 600, 700],
      defaultWeight: 400,
      fallbackStack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      cssVariableName: "--font-inter",
      importHint: "use next/font/google Inter with weights 400,500,600,700",
    },
    {
      id: "source-sans-3",
      name: "Source Sans 3",
      source: "google",
      category: "sans",
      weights: [400, 600, 700],
      defaultWeight: 400,
      fallbackStack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      cssVariableName: "--font-source-sans-3",
      importHint: "use next/font/google Source_Sans_3 with weights 400,600,700",
    },
    {
      id: "ibm-plex-sans",
      name: "IBM Plex Sans",
      source: "google",
      category: "sans",
      weights: [400, 500, 600, 700],
      defaultWeight: 400,
      fallbackStack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      cssVariableName: "--font-ibm-plex-sans",
      importHint: "use next/font/google IBM_Plex_Sans with weights 400,500,600,700",
    },
    {
      id: "space-grotesk",
      name: "Space Grotesk",
      source: "google",
      category: "display",
      weights: [400, 500, 600, 700],
      defaultWeight: 400,
      fallbackStack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      cssVariableName: "--font-space-grotesk",
      importHint: "use next/font/google Space_Grotesk with weights 400,500,600,700",
    },
    {
      id: "roboto-mono",
      name: "Roboto Mono",
      source: "google",
      category: "mono",
      weights: [400, 500, 700],
      defaultWeight: 400,
      fallbackStack: "'Courier New', Courier, monospace",
      cssVariableName: "--font-roboto-mono",
      importHint: "use next/font/google Roboto_Mono with weights 400,500,700",
    },
  ],
};

/**
 * Get a font definition by its ID
 * @param id - The font ID to look up
 * @returns The font definition if found, undefined otherwise
 */
export function getFontById(id: string): FontDefinition | undefined {
  return fontRegistry.fonts.find((font) => font.id === id);
}

/**
 * Get all fonts in a specific category
 * @param category - The font category to filter by
 * @returns Array of font definitions matching the category
 */
export function getFontsByCategory(category: FontCategory): FontDefinition[] {
  return fontRegistry.fonts.filter((font) => font.category === category);
}

/**
 * Get all available fonts
 * @returns Array of all font definitions
 */
export function getAllFonts(): FontDefinition[] {
  return [...fontRegistry.fonts];
}

