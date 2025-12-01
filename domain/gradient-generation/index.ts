import { Buffer } from "buffer";
import chroma from "chroma-js";

import {
  extractPaletteFromImage,
  type ColorExtractionResult,
  type ClassifiedColor,
} from "./color-extraction";

export type GradientStrategy = "single-accent" | "multi-accent" | "monochrome" | "fallback";

export interface GradientPreferences {
  angle?: number;
  temperature?: "warm" | "cool" | "neutral";
  intensity?: "soft" | "balanced" | "bold";
}

export interface GradientResult {
  angle: number;
  colorStart: string;
  colorEnd: string;
  debugInfo?: {
    extractedColors?: string[];
    strategy?: GradientStrategy;
    paletteStats?: {
      accentCount: number;
      baseCount: number;
      clusterCount: number;
    };
    mood?: PaletteMood;
    appliedPreferences?: GradientPreferences;
  };
}

export interface GenerateGradientOptions {
  maxSize?: number;
  debug?: boolean;
  preferences?: GradientPreferences;
}

type SupportedImageBuffer = Buffer | ArrayBuffer | ArrayBufferView;

type PaletteMood = {
  isGrayscale: boolean;
  isLowContrast: boolean;
  isHighlyColorful: boolean;
  averageSaturation: number;
  lightnessRange: number;
};

const DEFAULT_ANGLE = 135;
const FALLBACK_START = "#667eea";
const FALLBACK_END = "#764ba2";
const TEMPERATURE_PRESETS: Record<"warm" | "cool" | "neutral", { start: string; end: string }> = {
  warm: { start: "#f97316", end: "#f43f5e" },
  cool: { start: "#22d3ee", end: "#6366f1" },
  neutral: { start: FALLBACK_START, end: FALLBACK_END },
};

export async function generateGradientFromImage(
  imageBuffer: SupportedImageBuffer,
  options?: GenerateGradientOptions,
): Promise<GradientResult> {
  const normalizedBuffer = normalizeImageBuffer(imageBuffer);
  const byteLength = normalizedBuffer.byteLength;

  console.info(`[gradient-generator] Received image buffer with ${byteLength} bytes.`);

  if (!isLikelyImageBuffer(normalizedBuffer)) {
    console.warn(
      "[gradient-generator] Provided buffer does not appear to be a PNG/JPEG/GIF. Proceeding with cautious gradient extraction.",
    );
  }

  try {
    const palette = await extractPaletteFromImage(normalizedBuffer, {
      maxSize: options?.maxSize,
      debug: options?.debug,
    });
    const mood = analyzePaletteMood(palette);
    const strategy = determineStrategy(palette, mood);
    const baseColors = buildGradientFromPalette(palette, strategy, mood, options?.preferences);
    const { colorStart, colorEnd } = refineGradientColors(baseColors, options?.preferences, mood);

    const gradient: GradientResult = {
      angle: options?.preferences?.angle ?? DEFAULT_ANGLE,
      colorStart,
      colorEnd,
    };

    if (options?.debug) {
      gradient.debugInfo = {
        extractedColors: palette.colors.map((color) => color.hex),
        strategy,
        paletteStats: {
          accentCount: palette.accentColors.length,
          baseCount: palette.baseColors.length,
          clusterCount: palette.stats.clusterCount,
        },
        mood,
        appliedPreferences: options.preferences,
      };
    }

    return gradient;
  } catch (error) {
    console.error("[gradient-generator] Failed to build gradient, falling back to default", error);
    return {
      angle: DEFAULT_ANGLE,
      colorStart: FALLBACK_START,
      colorEnd: FALLBACK_END,
      debugInfo: options?.debug
        ? {
            strategy: "fallback",
            extractedColors: [FALLBACK_START, FALLBACK_END],
            appliedPreferences: options?.preferences,
          }
        : undefined,
    };
  }
}

function normalizeImageBuffer(imageBuffer: SupportedImageBuffer): Buffer {
  if (Buffer.isBuffer(imageBuffer)) {
    return imageBuffer;
  }

  if (imageBuffer instanceof ArrayBuffer) {
    return Buffer.from(imageBuffer);
  }

  if (ArrayBuffer.isView(imageBuffer)) {
    return Buffer.from(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength);
  }

  throw new Error(
    "Unsupported image buffer type. Expected Buffer, ArrayBuffer, or ArrayBufferView.",
  );
}

function isLikelyImageBuffer(buffer: Buffer): boolean {
  if (buffer.byteLength < 4) {
    return false;
  }

  const isPng =
    buffer.byteLength >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[buffer.byteLength - 2] === 0xff &&
    buffer[buffer.byteLength - 1] === 0xd9;

  const header = buffer.subarray(0, 6).toString("ascii");
  const isGif = header === "GIF87a" || header === "GIF89a";

  return isPng || isJpeg || isGif;
}

function analyzePaletteMood(palette: ColorExtractionResult): PaletteMood {
  const saturations = palette.colors.map((color) => color.saturation);
  const lightnesses = palette.colors.map((color) => color.lightness);
  const averageSaturation = saturations.length
    ? saturations.reduce((sum, value) => sum + value, 0) / saturations.length
    : 0;
  const maxSaturation = Math.max(...saturations, 0);
  const maxLight = Math.max(...lightnesses, 0);
  const minLight = Math.min(...lightnesses, 0);
  const lightnessRange = maxLight - minLight;

  return {
    isGrayscale: maxSaturation < 0.25,
    isLowContrast: lightnessRange < 0.22,
    isHighlyColorful: palette.accentColors.length >= 4 || averageSaturation > 0.65,
    averageSaturation,
    lightnessRange,
  };
}

function determineStrategy(palette: ColorExtractionResult, mood: PaletteMood): GradientStrategy {
  const strongAccents = getStrongAccentColors(palette, mood);
  const accentPopulation = strongAccents.reduce((sum, entry) => sum + entry.population, 0);
  if (strongAccents.length >= 2 && accentPopulation >= 0.25) {
    return "multi-accent";
  }
  if (strongAccents.length >= 1) {
    return "single-accent";
  }
  if (palette.baseColors.length > 0 || palette.colors.length > 0) {
    return "monochrome";
  }
  return "fallback";
}

function buildGradientFromPalette(
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

function refineGradientColors(
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

function selectAccentPair(
  accentColors: ClassifiedColor[],
): [ClassifiedColor, ClassifiedColor] | null {
  if (accentColors.length < 2) {
    return null;
  }

  let bestPair: [ClassifiedColor, ClassifiedColor] | null = null;
  let bestScore = 0;

  for (let i = 0; i < accentColors.length; i += 1) {
    for (let j = i + 1; j < accentColors.length; j += 1) {
      const first = accentColors[i];
      const second = accentColors[j];
      const distance = labDistance(first.hex, second.hex);
      const score = distance * (first.population + second.population);
      if (score > bestScore) {
        bestScore = score;
        bestPair = [first, second];
      }
    }
  }

  return bestPair;
}

function getStrongAccentColors(
  palette: ColorExtractionResult,
  mood: PaletteMood,
): ClassifiedColor[] {
  const threshold = mood.isHighlyColorful ? 0.25 : 0.35;
  return [...palette.accentColors]
    .filter((color) => color.saturation >= threshold)
    .sort((a, b) => b.population - a.population)
    .slice(0, mood.isHighlyColorful ? 3 : 4);
}

function harmonizeColor(
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

function mixColors(primary: string, secondary: string, ratio = 0.5): string {
  const safeRatio = clamp(ratio, 0, 1);
  return chroma.mix(primary, secondary, safeRatio, "lab").hex();
}

function applyTemperaturePreference(hex: string, temperature: "warm" | "cool"): string {
  const anchor = temperature === "warm" ? "#fb7185" : "#38bdf8";
  return chroma.mix(hex, anchor, 0.25, "lab").hex();
}

function applyIntensityPreference(
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

function ensureContrast(
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

function labDistance(first: string, second: string): number {
  const [l1, a1, b1] = chroma(first).lab();
  const [l2, a2, b2] = chroma(second).lab();
  const dL = l1 - l2;
  const dA = a1 - a2;
  const dB = b1 - b2;
  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
