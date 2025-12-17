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

// Font styles - semantic typographic systems for free users
export type FontStyle = "founder" | "billboard" | "terminal" | "editorial";

// Legacy types - kept for backward compatibility during migration
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

// Import color source types for detailed gradient tracking
export type { ColorSourceInfo, ColorSourceType } from "./gradients/color-source";

// Keep legacy type for backward compatibility
export type GradientSource = "preset" | "screenshot" | "custom";

export type BackgroundConfig = {
  type: BackgroundType;
  value: string; // gradientId, assetId, or ColorToken
  customGradient?: CustomGradient; // for custom/dynamic gradients
  // Union type: accepts both string (legacy) and detailed info (new)
  gradientSource?: GradientSource | import("./gradients/color-source").ColorSourceInfo;
  grainEnabled?: boolean; // legacy toggle for grain overlay on gradient backgrounds
  patternId?: PatternChoice; // explicit pattern selection
  patternMode?: PatternMode; // auto or manual selection
};

// Layout configuration - simple data structure
export type LayoutConfig = {
  layoutId: string;
  variant: string; // Layout-specific variant (e.g., "left", "right", "center")
  fontStyle: FontStyle;
  // Legacy fields - kept for backward compatibility during migration
  fontId?: FontId;
  fontSize?: FontSize;
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
  layoutSpecificSettings?: {
    fadeEnabled?: Record<string, boolean>; // Per-layout fade state
  };
  code?: {
    content: string;
    language: string;
    theme?: string;
  };
};
