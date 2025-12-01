// Simple color palette - limited set for simplicity
export type ColorToken =
  | "slate-50"
  | "slate-100"
  | "slate-200"
  | "slate-300"
  | "slate-500"
  | "slate-600"
  | "slate-800"
  | "slate-900"
  | "zinc-50"
  | "zinc-200"
  | "zinc-900"
  | "indigo-50"
  | "indigo-400"
  | "indigo-950"
  | "violet-400"
  | "violet-500";

export type BackgroundType = "gradient" | "image" | "solid";

export type ShadowIntensity = "low" | "medium" | "high";

export type FontId =
  | "clean"
  | "professional"
  | "developer"
  | "bold"
  | "friendly"
  | "edgy"
  | "technical"
  | "premium";

export type FontSize = "sm" | "md" | "lg" | "xl" | "2xl";

// Re-export gradient types from gradients module for backward compatibility
export type {
  GradientStop,
  GradientType,
  GradientColorSpace,
  AdvancedGradient,
  LegacyGradient,
  CustomGradient,
} from "./gradients/types";

export { isLegacyGradient, isAdvancedGradient } from "./gradients/types";

import type { CustomGradient } from "./gradients/types";

export type BackgroundConfig = {
  type: BackgroundType;
  value: string; // gradientId, assetId, or ColorToken
  customGradient?: CustomGradient; // for custom/dynamic gradients
};

// Layout configuration - simple data structure
export type LayoutConfig = {
  templateId: string;
  variant: string; // Template-specific variant (e.g., "left", "right", "center")
  fontId: FontId;
  fontSize: FontSize;
  text: {
    title: string;
    subtitle?: string;
  };
  colors: {
    background: ColorToken;
    text: ColorToken;
    accent: ColorToken;
  };
  background: BackgroundConfig;
  assets: {
    screenshot?: string; // Asset ID
    logo?: string; // Asset ID
    background?: string; // Asset ID for background image
  };
  screenshotShadow?: ShadowIntensity;
};
