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

export type EffectState = {
  tintOverlay: boolean;
  blobOverlay: boolean;
  grain: boolean;
  vignette: VignetteEffect;
  patternGrid: boolean;
  blur: boolean;
};
