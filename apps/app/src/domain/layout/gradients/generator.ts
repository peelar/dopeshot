/**
 * Gradient Generator - Palette-Matched Gradients
 *
 * Produces a consistent set of gradients from a color signature:
 * - Mesh (bold, expressive)
 * - Aurora (flowing, high-impact)
 * - Linear bold (clean, directional)
 * - Radial glow (focused highlight)
 * - Linear soft (ambient, directional)
 * - Muted wash (soft soup, non-directional)
 */

import { AdvancedGradient, MeshLayer } from "./types";
import { hexToRgba } from "./utils";
import { buildGradientPalette, ColorSignature, getSecondaryHueCandidates } from "./palette";

const DEFAULT_SIGNATURE: ColorSignature = {
  dominantHue: "purple",
  dominantHueAngle: 278,
  brightness: "medium",
  accentStrength: "vibrant",
  dominantColor: "#a855f7",
  accentColor: "#8b5cf6",
};

type PaletteColors = ReturnType<typeof buildGradientPalette>["colors"];

function buildMeshGradient(colors: PaletteColors, brightness: ColorSignature["brightness"]): AdvancedGradient {
  const alphaBase = brightness === "dark" ? 0.62 : brightness === "light" ? 0.8 : 0.72;
  const layers: MeshLayer[] = [
    { color: hexToRgba(colors.primary, alphaBase + 0.08), position: { x: 12, y: 18 }, size: 74 },
    { color: hexToRgba(colors.secondary, alphaBase + 0.04), position: { x: 86, y: 20 }, size: 68 },
    { color: hexToRgba(colors.tertiary, alphaBase - 0.08), position: { x: 58, y: 78 }, size: 86 },
    { color: hexToRgba(colors.glow, alphaBase - 0.16), position: { x: 18, y: 74 }, size: 62 },
    { color: hexToRgba(colors.primary, alphaBase - 0.2), position: { x: 50, y: 50 }, size: 96 },
    { color: hexToRgba(colors.secondary, alphaBase - 0.28), position: { x: 74, y: 56 }, size: 72 },
  ];

  return {
    type: "linear",
    stops: [
      { color: colors.primary, position: 0 },
      { color: colors.secondary, position: 100 },
    ],
    meshLayers: layers,
    colorSpace: "oklch",
  };
}

function buildAuroraGradient(colors: PaletteColors): AdvancedGradient {
  return {
    type: "linear",
    angle: 135,
    stops: [
      { color: colors.primary, position: 0 },
      { color: colors.secondary, position: 40 },
      { color: colors.tertiary, position: 72 },
      { color: colors.glow, position: 100 },
    ],
    colorSpace: "oklch",
  };
}

function buildLinearBoldGradient(colors: PaletteColors): AdvancedGradient {
  return {
    type: "linear",
    stops: [
      { color: colors.primary, position: 0 },
      { color: colors.secondary, position: 100 },
    ],
    colorSpace: "oklch",
  };
}

function buildRadialGlowGradient(colors: PaletteColors): AdvancedGradient {
  return {
    type: "radial",
    direction: "circle at 30% 35%",
    stops: [
      { color: colors.glow, position: 0 },
      { color: colors.primary, position: 45 },
      { color: colors.secondary, position: 100 },
    ],
    layoutHint: "beam",
    colorSpace: "oklch",
  };
}

function buildLinearSoftGradient(colors: PaletteColors): AdvancedGradient {
  return {
    type: "linear",
    stops: [
      { color: colors.secondary, position: 0 },
      { color: colors.neutral, position: 55 },
      { color: colors.primary, position: 100 },
    ],
    colorSpace: "oklch",
  };
}

function buildMutedWashGradient(colors: PaletteColors, brightness: ColorSignature["brightness"]): AdvancedGradient {
  const washAlpha = brightness === "dark" ? 0.45 : brightness === "light" ? 0.55 : 0.5;
  const layers: MeshLayer[] = [
    { color: hexToRgba(colors.neutral, washAlpha + 0.05), position: { x: 20, y: 25 }, size: 90 },
    { color: hexToRgba(colors.secondary, washAlpha), position: { x: 78, y: 18 }, size: 78 },
    { color: hexToRgba(colors.primary, washAlpha - 0.08), position: { x: 62, y: 80 }, size: 92 },
    { color: hexToRgba(colors.glow, washAlpha - 0.12), position: { x: 22, y: 72 }, size: 70 },
  ];

  return {
    type: "linear",
    stops: [
      { color: colors.neutral, position: 0 },
      { color: colors.secondary, position: 55 },
      { color: colors.primary, position: 100 },
    ],
    meshLayers: layers,
    colorSpace: "oklch",
  };
}

export function generateGradientOptions(signature: ColorSignature = DEFAULT_SIGNATURE): AdvancedGradient[] {
  const [baseSecondary, altSecondaryA, altSecondaryB] = getSecondaryHueCandidates(signature);
  const palette = buildGradientPalette(signature, baseSecondary);
  const paletteAltA = altSecondaryA ? buildGradientPalette(signature, altSecondaryA) : palette;
  const paletteAltB = altSecondaryB ? buildGradientPalette(signature, altSecondaryB) : palette;

  return [
    buildMeshGradient(palette.colors, signature.brightness),
    buildAuroraGradient(paletteAltA.colors),
    buildLinearBoldGradient(palette.colors),
    buildRadialGlowGradient(paletteAltB.colors),
    buildLinearSoftGradient(palette.colors),
    buildMutedWashGradient(paletteAltA.colors, signature.brightness),
  ];
}
