import { FontId, FontSize } from "./types";

export interface FontSizeDefinition {
  id: FontSize;
  label: string;
  titleClass: string; // Tailwind class for title
  subtitleClass: string; // Tailwind class for subtitle
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
  return FONT_SIZES.find((s) => s.id === id) ?? FONT_SIZES[1]; // Default to md
}

export interface FontDefinition {
  id: FontId;
  alias: string; // User-facing vibe name
  fontName: string; // Actual font name
  foundry: string; // Font creator/source
  cssVariable: string; // CSS variable name (e.g., "--font-clean")
}

export const FONTS: FontDefinition[] = [
  {
    id: "clean",
    alias: "Founder Mode",
    fontName: "Geist Sans",
    foundry: "Vercel",
    cssVariable: "--font-clean",
  },
  {
    id: "professional",
    alias: "Corporate",
    fontName: "Inter",
    foundry: "Rasmus Andersson",
    cssVariable: "--font-professional",
  },
  {
    id: "developer",
    alias: "Terminal",
    fontName: "JetBrains Mono",
    foundry: "JetBrains",
    cssVariable: "--font-developer",
  },
  {
    id: "bold",
    alias: "Unhinged",
    fontName: "Space Grotesk",
    foundry: "Florian Karsten",
    cssVariable: "--font-bold",
  },
  {
    id: "friendly",
    alias: "Normie",
    fontName: "DM Sans",
    foundry: "Colophon Foundry",
    cssVariable: "--font-friendly",
  },
  {
    id: "edgy",
    alias: "Chaotic",
    fontName: "Syne",
    foundry: "Bonjour Monde",
    cssVariable: "--font-edgy",
  },
  {
    id: "technical",
    alias: "Spreadsheet",
    fontName: "Archivo",
    foundry: "Omnibus-Type",
    cssVariable: "--font-technical",
  },
  {
    id: "premium",
    alias: "Expensive",
    fontName: "Manrope",
    foundry: "Mikhail Sharanda",
    cssVariable: "--font-premium",
  },
];

export const DEFAULT_FONT_ID: FontId = "clean";

export function getFontById(id: FontId): FontDefinition | undefined {
  return FONTS.find((f) => f.id === id);
}

export function getFontCssValue(id: FontId): string {
  const font = getFontById(id);
  return font ? `var(${font.cssVariable})` : "var(--font-clean)";
}

