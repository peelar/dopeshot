import type { TestPalette } from "./types";

/**
 * Test palettes for gradient evaluation
 * These palettes stress-test gradient resilience across different color profiles
 */
export const TEST_PALETTES: TestPalette[] = [
  {
    id: "dark-warm",
    name: "Dark neutral + warm accent",
    colors: {
      primary: "#1a1a1a",
      secondary: "#f97316",
      neutral: "#262626",
    },
  },
  {
    id: "dark-cool",
    name: "Dark neutral + cool accent",
    colors: {
      primary: "#1a1a1a",
      secondary: "#3b82f6",
      neutral: "#262626",
    },
  },
  {
    id: "light-warm",
    name: "Light neutral + warm accent",
    colors: {
      primary: "#f5f5f5",
      secondary: "#f97316",
      neutral: "#e5e5e5",
    },
  },
  {
    id: "light-cool",
    name: "Light neutral + cool accent",
    colors: {
      primary: "#f5f5f5",
      secondary: "#3b82f6",
      neutral: "#e5e5e5",
    },
  },
  {
    id: "mono-dark",
    name: "Near-monochrome dark",
    colors: {
      primary: "#1a1a1a",
      secondary: "#404040",
      neutral: "#262626",
    },
  },
  {
    id: "mono-light",
    name: "Near-monochrome light",
    colors: {
      primary: "#f5f5f5",
      secondary: "#d4d4d4",
      neutral: "#e5e5e5",
    },
  },
  {
    id: "high-saturation",
    name: "High-saturation accent (stress)",
    colors: {
      primary: "#1a1a1a",
      secondary: "#ff0080",
      tertiary: "#00ff80",
      neutral: "#262626",
    },
  },
  {
    id: "two-accent",
    name: "Two-accent palette (stress)",
    colors: {
      primary: "#1a1a1a",
      secondary: "#ec4899",
      tertiary: "#8b5cf6",
      neutral: "#262626",
    },
  },
];

export function getPaletteById(id: string): TestPalette | undefined {
  return TEST_PALETTES.find((p) => p.id === id);
}
