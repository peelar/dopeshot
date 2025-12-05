import chroma from "chroma-js";
import { clamp, labDistance } from "./utils";

export function harmonizeColor(
  hex: string,
  adjustments: {
    brighten?: number;
    darken?: number;
    saturate?: number;
    desaturate?: number;
  } = {},
): string {
  let color = chroma(hex);
  if (adjustments.desaturate) {
    color = color.desaturate(adjustments.desaturate);
  }
  if (adjustments.saturate) {
    color = color.saturate(adjustments.saturate);
  }
  if (adjustments.brighten) {
    color = color.brighten(adjustments.brighten);
  }
  if (adjustments.darken) {
    color = color.darken(adjustments.darken);
  }

  const [h, s, l] = color.hsl();
  const safeSaturation = clamp(Number.isFinite(s) ? s : 0.1, 0, 1);
  const safeLightness = clamp(Number.isFinite(l) ? l : 0.5, 0, 1);
  return chroma.hsl(h ?? 0, safeSaturation, safeLightness).hex();
}

export function mixColors(primary: string, secondary: string, ratio = 0.5): string {
  const safeRatio = clamp(ratio, 0, 1);
  return chroma.mix(primary, secondary, safeRatio, "lab").hex();
}

export function applyTemperaturePreference(hex: string, temperature: "warm" | "cool"): string {
  const anchor = temperature === "warm" ? "#fb7185" : "#38bdf8";
  return chroma.mix(hex, anchor, 0.25, "lab").hex();
}

export function applyIntensityPreference(
  hex: string,
  intensity: "soft" | "balanced" | "bold",
  position: "start" | "end",
): string {
  if (intensity === "soft") {
    return harmonizeColor(hex, {
      desaturate: 0.2,
      brighten: position === "start" ? 0.2 : 0.05,
    });
  }

  if (intensity === "bold") {
    return harmonizeColor(hex, {
      saturate: 0.4,
      darken: position === "end" ? 0.35 : 0.1,
    });
  }

  return harmonizeColor(hex, {
    saturate: 0.15,
    darken: position === "end" ? 0.15 : 0,
    brighten: position === "start" ? 0.1 : 0,
  });
}

export function ensureContrast(
  colorStart: string,
  colorEnd: string,
  minDistance = 8,
): { colorStart: string; colorEnd: string } {
  if (colorStart.toLowerCase() === colorEnd.toLowerCase()) {
    const adjustedEnd = harmonizeColor(colorEnd, { darken: 0.4, saturate: 0.15 });
    return { colorStart, colorEnd: adjustedEnd };
  }

  const distance = labDistance(colorStart, colorEnd);
  if (distance < minDistance) {
    const adjustedEnd = harmonizeColor(colorEnd, { darken: 0.5, saturate: 0.2 });
    return { colorStart, colorEnd: adjustedEnd };
  }

  return { colorStart, colorEnd };
}


