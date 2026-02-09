import { ShadowIntensity } from "@/domain/layout/types";
import type { PersonalityShadow } from "@/domain/brand/personality-mapping";

type ShadowRole = "contact" | "ambient";

type ShadowLayer = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  opacity: number;
  role: ShadowRole;
};

type ShadowRecipe = {
  layers: ShadowLayer[];
};

type ShadowColorPalette = {
  contact: RGB;
  ambient: RGB;
};

type RGB = {
  r: number;
  g: number;
  b: number;
};

const FALLBACK_SURFACE_RGB: RGB = { r: 15, g: 23, b: 42 };
const DEEP_SHADOW_RGB: RGB = { r: 2, g: 6, b: 23 };

const SHADOW_PRESETS: Record<ShadowIntensity, ShadowRecipe> = {
  low: {
    layers: [
      { x: 0, y: 1, blur: 2, spread: -1, opacity: 0.22, role: "contact" },
      { x: 0, y: 2, blur: 5, spread: -2, opacity: 0.16, role: "contact" },
      { x: 0, y: 6, blur: 12, spread: -3, opacity: 0.11, role: "ambient" },
      { x: 0, y: 12, blur: 24, spread: -8, opacity: 0.08, role: "ambient" },
    ],
  },
  medium: {
    layers: [
      { x: 0, y: 1, blur: 2, spread: -1, opacity: 0.26, role: "contact" },
      { x: 0, y: 4, blur: 8, spread: -2, opacity: 0.2, role: "contact" },
      { x: 0, y: 10, blur: 18, spread: -4, opacity: 0.15, role: "ambient" },
      { x: 0, y: 20, blur: 34, spread: -8, opacity: 0.11, role: "ambient" },
      { x: 0, y: 34, blur: 56, spread: -14, opacity: 0.08, role: "ambient" },
    ],
  },
  high: {
    layers: [
      { x: 0, y: 2, blur: 4, spread: -1, opacity: 0.32, role: "contact" },
      { x: 0, y: 7, blur: 14, spread: -2, opacity: 0.25, role: "contact" },
      { x: 0, y: 16, blur: 28, spread: -5, opacity: 0.19, role: "ambient" },
      { x: 0, y: 30, blur: 48, spread: -10, opacity: 0.14, role: "ambient" },
      { x: 0, y: 46, blur: 72, spread: -18, opacity: 0.1, role: "ambient" },
    ],
  },
};

export function getShadowValue(
  intensity?: ShadowIntensity,
  options?: { surfaceColor?: string },
) {
  const recipe = SHADOW_PRESETS[intensity || "medium"];
  const colors = getShadowPalette(options?.surfaceColor);

  return recipe.layers.map((layer) => layerToCss(layer, colors)).join(", ");
}

/**
 * Build a CSS box-shadow string from a PersonalityShadow configuration.
 * Uses layered contact + ambient shadows for more realistic depth.
 */
export function buildShadowFromStyle(
  shadow: PersonalityShadow,
  options?: { surfaceColor?: string },
): string {
  const { blur, spread, offsetY, opacity, tint } = shadow;

  // If no shadow (all zeros), return none
  if (blur === 0 && spread === 0 && offsetY === 0 && opacity === 0) {
    return "none";
  }

  const colors = getShadowPalette(options?.surfaceColor);
  const layers = buildPersonalityLayers({ blur, spread, offsetY, opacity });
  const cssLayers = layers.map((layer) => layerToCss(layer, colors));

  if (tint) {
    const tintedLayer = `0 ${Math.max(1, Math.round(offsetY * 0.95))}px ${Math.max(8, Math.round(blur * 1.1))}px ${spread}px ${tint}`;
    cssLayers.splice(3, 0, tintedLayer);
  }

  return cssLayers.join(", ");
}

function buildPersonalityLayers({
  blur,
  spread,
  offsetY,
  opacity,
}: {
  blur: number;
  spread: number;
  offsetY: number;
  opacity: number;
}): ShadowLayer[] {
  const safeBlur = Math.max(1, blur);
  const safeOffsetY = Math.max(1, offsetY);
  const safeSpread = Number.isFinite(spread) ? spread : 0;

  return [
    {
      x: 0,
      y: Math.max(1, Math.round(safeOffsetY * 0.2)),
      blur: Math.max(1, Math.round(safeBlur * 0.22)),
      spread: Math.min(0, safeSpread - 1),
      opacity: clamp(opacity * 1.15, 0.05, 0.45),
      role: "contact",
    },
    {
      x: 0,
      y: Math.max(2, Math.round(safeOffsetY * 0.55)),
      blur: Math.max(3, Math.round(safeBlur * 0.55)),
      spread: safeSpread,
      opacity: clamp(opacity * 0.85, 0.04, 0.35),
      role: "contact",
    },
    {
      x: 0,
      y: Math.max(4, Math.round(safeOffsetY)),
      blur: Math.max(6, Math.round(safeBlur * 0.95)),
      spread: safeSpread,
      opacity: clamp(opacity * 0.62, 0.03, 0.28),
      role: "ambient",
    },
    {
      x: 0,
      y: Math.max(8, Math.round(safeOffsetY * 1.75)),
      blur: Math.max(12, Math.round(safeBlur * 1.45)),
      spread: safeSpread - 2,
      opacity: clamp(opacity * 0.45, 0.02, 0.2),
      role: "ambient",
    },
  ];
}

function layerToCss(layer: ShadowLayer, colors: ShadowColorPalette): string {
  const color = layer.role === "contact" ? colors.contact : colors.ambient;
  return `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px rgba(${color.r}, ${color.g}, ${color.b}, ${layer.opacity})`;
}

function getShadowPalette(surfaceColor?: string): ShadowColorPalette {
  const surface = parseColorToRgb(surfaceColor) ?? FALLBACK_SURFACE_RGB;
  return {
    contact: mixColors(surface, DEEP_SHADOW_RGB, 0.86),
    ambient: mixColors(surface, DEEP_SHADOW_RGB, 0.74),
  };
}

function mixColors(a: RGB, b: RGB, amount: number): RGB {
  const t = clamp(amount, 0, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function parseColorToRgb(color?: string): RGB | null {
  if (!color) return null;
  const value = color.trim().toLowerCase();

  const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: Number.parseInt(`${hex[0]}${hex[0]}`, 16),
        g: Number.parseInt(`${hex[1]}${hex[1]}`, 16),
        b: Number.parseInt(`${hex[2]}${hex[2]}`, 16),
      };
    }
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbMatch = value.match(
    /rgba?\(\s*(\d{1,3})(?:\s+|,\s*)(\d{1,3})(?:\s+|,\s*)(\d{1,3})(?:\s*[,/]\s*[\d.]+)?\s*\)/i,
  );
  if (rgbMatch) {
    return {
      r: clampInt(Number.parseInt(rgbMatch[1], 10), 0, 255),
      g: clampInt(Number.parseInt(rgbMatch[2], 10), 0, 255),
      b: clampInt(Number.parseInt(rgbMatch[3], 10), 0, 255),
    };
  }

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampInt(value: number, min: number, max: number): number {
  return Math.round(clamp(value, min, max));
}
