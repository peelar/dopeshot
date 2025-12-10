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
export type PatternId = "grain" | "glow" | "grid";
export type PatternChoice = PatternId | "none";
export type PatternMode = "auto" | "manual";

export type ShadowIntensity = "low" | "medium" | "high";

export type ScreenshotFramePreset = "soft-glass" | "solid";

export type FrameShape = "rounded" | "rectangular";

export type CanvasMode = "adaptive" | "locked";

export type ScreenshotTreatment = {
  preset: ScreenshotFramePreset;
  canvasMode: CanvasMode;
  lockedAspectRatio?: number; // defaults to 16:9 when locked
  shadowEnabled?: boolean;
  shape?: FrameShape;
  fadeEnabled?: boolean;
};

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

export type AIBackgroundStyle = "abstract-shapes" | "geometric" | "flowing" | "particles";

export interface AIBackgroundConfig {
  id: string;
  prompt: string;
  style: AIBackgroundStyle;
  complexity: number; // 1-10
  colorSource: "screenshot" | "custom";
  imageUrl: string; // placeholder or real URL
  createdAt: number;
}

export type BackgroundConfig = {
  type: BackgroundType;
  value: string; // gradientId, assetId, AI background ID, or ColorToken
  customGradient?: CustomGradient; // for custom/dynamic gradients
  grainEnabled?: boolean; // legacy toggle for grain overlay on gradient backgrounds
  patternId?: PatternChoice; // explicit pattern selection
  patternMode?: PatternMode; // auto or manual selection
};

// Layout configuration - simple data structure
export type LayoutConfig = {
  lookId: string;
  variant: string; // Look-specific variant (e.g., "left", "right", "center")
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
  screenshotFrame?: ScreenshotTreatment;
  aiBackgrounds?: AIBackgroundConfig[]; // Store generated AI backgrounds
  lookSpecificSettings?: {
    fadeEnabled?: Record<string, boolean>; // Per-look fade state
  };
  code?: {
    content: string;
    language: string;
    theme?: string;
  };
};
