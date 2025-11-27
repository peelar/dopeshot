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

export type BackgroundConfig = {
  type: BackgroundType;
  value: string; // gradientId, assetId, or ColorToken
};

// Layout configuration - simple data structure
export type LayoutConfig = {
  templateId: string;
  variant: string; // Template-specific variant (e.g., "left", "right", "center")
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
