import { ColorToken } from "./types";

export interface GradientPreset {
  id: string;
  name: string;
  value: string;
  textColor: ColorToken;
}

export const GRADIENTS: GradientPreset[] = [
  {
    id: "hyper",
    name: "Hyper",
    value: "linear-gradient(to right, #ec4899, #8b5cf6)",
    textColor: "slate-50",
  },
  {
    id: "oceanic",
    name: "Oceanic",
    value: "linear-gradient(to right, #2E3192, #1BFFFF)",
    textColor: "slate-50",
  },
  {
    id: "cotton-candy",
    name: "Cotton Candy",
    value: "linear-gradient(to right, #D4145A, #FBB03B)",
    textColor: "slate-900",
  },
  {
    id: "sunset",
    name: "Sunset",
    value: "linear-gradient(to right, #ff7e5f, #feb47b)",
    textColor: "slate-900",
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    value: "linear-gradient(to right, #43cea2, #185a9d)",
    textColor: "slate-50",
  },
  {
    id: "midnight",
    name: "Midnight",
    value: "linear-gradient(to right, #232526, #414345)",
    textColor: "slate-50",
  },
  {
    id: "lush",
    name: "Lush",
    value: "linear-gradient(to right, #56ab2f, #a8e063)",
    textColor: "slate-900",
  },
  {
    id: "frost",
    name: "Frost",
    value: "linear-gradient(to right, #000428, #004e92)",
    textColor: "slate-50",
  },
];

export function getGradientById(id: string): GradientPreset | undefined {
  return GRADIENTS.find((g) => g.id === id);
}

export const DEFAULT_GRADIENT = GRADIENTS[0];
