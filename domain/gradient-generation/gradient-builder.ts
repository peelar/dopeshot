import type { ColorExtractionResult } from "./color-extraction";
import type { GradientStrategy, PaletteMood } from "./strategy";
import type { GradientPreferences } from "./index";
import {
  harmonizeColor,
  mixColors,
  applyTemperaturePreference,
  applyIntensityPreference,
  ensureContrast,
} from "./color-manipulation";
import { getStrongAccentColors, selectAccentPair } from "./strategy";

const FALLBACK_START = "#667eea";
const FALLBACK_END = "#764ba2";
const TEMPERATURE_PRESETS: Record<"warm" | "cool" | "neutral", { start: string; end: string }> = {
  warm: { start: "#f97316", end: "#f43f5e" },
  cool: { start: "#22d3ee", end: "#6366f1" },
  neutral: { start: FALLBACK_START, end: FALLBACK_END },
};

export function buildGradientFromPalette(
  palette: ColorExtractionResult,
  strategy: GradientStrategy,
  mood: PaletteMood,
  preferences?: GradientPreferences,
): { colorStart: string; colorEnd: string } {
  const strongAccents = getStrongAccentColors(palette, mood);

  if (strategy === "multi-accent") {
    const pair = selectAccentPair(strongAccents);
    if (pair) {
      return {
        colorStart: harmonizeColor(pair[0].hex, { brighten: 0.2, desaturate: 0.15 }),
        colorEnd: harmonizeColor(pair[1].hex, { saturate: 0.3, darken: 0.1 }),
      };
    }
  }

  if (strategy === "single-accent") {
    const accent = strongAccents[0] ?? palette.accentColors[0] ?? palette.colors[0];
    const base = palette.baseColors[0] ?? palette.colors[0];
    const baseBlend =
      base && accent ? mixColors(base.hex, accent.hex, 0.4) : (accent?.hex ?? FALLBACK_START);
    const start = harmonizeColor(baseBlend, { brighten: 0.25, desaturate: 0.1 });
    const accentHex = accent?.hex ?? FALLBACK_END;
    const end = harmonizeColor(accentHex, { saturate: 0.5, darken: 0.15 });
    return ensureContrast(start, end, mood.isLowContrast ? 12 : 8);
  }

  if (strategy === "monochrome") {
    if (mood.isGrayscale) {
      const preset = TEMPERATURE_PRESETS[preferences?.temperature ?? "neutral"];
      return { colorStart: preset.start, colorEnd: preset.end };
    }
    const base = palette.baseColors[0]?.hex ?? palette.colors[0]?.hex ?? FALLBACK_START;
    const start = harmonizeColor(base, { brighten: 0.35, desaturate: 0.2 });
    const end = harmonizeColor(base, { darken: 0.45, saturate: 0.15 });
    return ensureContrast(start, end, mood.isLowContrast ? 12 : 8);
  }

  return { colorStart: FALLBACK_START, colorEnd: FALLBACK_END };
}

export function refineGradientColors(
  colors: { colorStart: string; colorEnd: string },
  preferences: GradientPreferences | undefined,
  mood: PaletteMood,
): { colorStart: string; colorEnd: string } {
  const temperature = preferences?.temperature ?? (mood.isGrayscale ? "warm" : "neutral");
  const intensity = preferences?.intensity ?? (mood.isLowContrast ? "bold" : "balanced");

  let start = colors.colorStart;
  let end = colors.colorEnd;
  if (!start) {
    start = FALLBACK_START;
  }
  if (!end) {
    end = FALLBACK_END;
  }

  if (temperature !== "neutral") {
    start = applyTemperaturePreference(start, temperature);
    end = applyTemperaturePreference(end, temperature);
  }

  start = applyIntensityPreference(start, intensity, "start");
  end = applyIntensityPreference(end, intensity, "end");

  return ensureContrast(start, end, mood.isLowContrast ? 12 : 8);
}






