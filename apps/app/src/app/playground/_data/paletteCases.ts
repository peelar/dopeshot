import type { PaletteInput } from "../_types";

export const paletteCases: PaletteInput[] = [
  {
    id: "case-a",
    title: "Case A",
    description: "Light, professional, low saturation (SaaS-ish)",
    colors: {
      dominant: "#f1f5f9",
      accent: "#64748b",
      muted: "#e2e8f0",
      vibrant: "#5b7ce3",
    },
  },
  {
    id: "case-b",
    title: "Case B",
    description: "Dark, technical, high contrast",
    colors: {
      dominant: "#0f172a",
      accent: "#22d3ee",
      muted: "#1e293b",
      vibrant: "#38bdf8",
    },
  },
  {
    id: "case-c",
    title: "Case C",
    description: "Colorful, playful, higher saturation",
    colors: {
      dominant: "#f97316",
      accent: "#22c55e",
      muted: "#facc15",
      vibrant: "#6366f1",
    },
  },
];
