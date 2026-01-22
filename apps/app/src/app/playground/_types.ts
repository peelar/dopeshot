import type { ColorPalette } from "@/domain/asset/types";
import type { CustomGradient } from "@/domain/layout/gradients/types";

export type PaletteInput = {
  id: "case-a" | "case-b" | "case-c";
  title: string;
  description: string;
  colors: ColorPalette;
};

export type GeneratedGradient = {
  palette: PaletteInput;
  gradient: CustomGradient;
  css: string;
};

export type VignetteMode = "darken" | "lighten";

export type VignetteEffect = {
  enabled: boolean;
  strength: number;
  radius: number;
  softness: number;
  mode: VignetteMode;
};

export type GrainBlendMode = "soft-light" | "overlay" | "multiply" | "normal";

export type GrainEffect = {
  enabled: boolean;
  amount: number;
  scale: number;
  blendMode: GrainBlendMode;
  useSeed: boolean;
  seed: number;
};

export type BlobBlendMode = "screen" | "soft-light" | "overlay" | "normal";
export type BlobPlacement = "diagonal" | "corners" | "randomBalanced";

export type BlobOverlayEffect = {
  enabled: boolean;
  count: number;
  strength: number;
  softness: number;
  scale: number;
  blendMode: BlobBlendMode;
  seed: number;
  placement: BlobPlacement;
};

export type EffectState = {
  tintOverlay: boolean;
  blobOverlay: BlobOverlayEffect;
  grain: GrainEffect;
  vignette: VignetteEffect;
  patternGrid: boolean;
  blur: boolean;
};
