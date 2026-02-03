import { ColorPalette } from "./types";
import type {
  AccentStrength,
  Brightness,
  ColorSignature,
  HueBucket,
} from "@/domain/layout/gradients/palette";

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

type SampleStats = {
  palette: ColorPalette;
  avgLightness: number;
  avgSaturation: number;
  dominantHueAngle: number;
  accentHueAngle: number;
  accentSaturation: number;
};

const MAX_SAMPLE_SIZE = 64;
const MIN_ALPHA = 16;
const NEUTRAL_SATURATION = 0.12;
const ACCENT_SATURATION = 0.18;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h, s, l };
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function hueToBucket(hue: number): HueBucket {
  if (hue >= 345 || hue < 15) return "red";
  if (hue < 45) return "orange";
  if (hue < 75) return "yellow";
  if (hue < 165) return "green";
  if (hue < 195) return "teal";
  if (hue < 255) return "blue";
  if (hue < 285) return "purple";
  if (hue < 345) return "pink";
  return "neutral";
}

function classifyBrightness(avgLightness: number): Brightness {
  if (avgLightness < 0.38) return "dark";
  if (avgLightness > 0.72) return "light";
  return "medium";
}

function classifyStrength(avgSaturation: number): AccentStrength {
  if (avgSaturation < 0.08) return "grayscale";
  if (avgSaturation < 0.22) return "muted";
  return "vibrant";
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

async function sampleImageColors(src: string): Promise<SampleStats | null> {
  try {
    const img = await loadImage(src);
    const ratio = Math.min(
      MAX_SAMPLE_SIZE / img.width,
      MAX_SAMPLE_SIZE / img.height,
      1,
    );
    const width = Math.max(1, Math.round(img.width * ratio));
    const height = Math.max(1, Math.round(img.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;

    const stride = width * height > 4096 ? 2 : 1;
    const bucketCount = 12;
    const buckets = Array.from({ length: bucketCount }, () => ({
      weight: 0,
      r: 0,
      g: 0,
      b: 0,
    }));

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let sumLightness = 0;
    let sumSaturation = 0;
    let count = 0;

    let mutedR = 0;
    let mutedG = 0;
    let mutedB = 0;
    let mutedCount = 0;

    let vibrantScore = 0;
    let vibrantColor: Rgb | null = null;

    for (let i = 0; i < data.length; i += 4 * stride) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < MIN_ALPHA) continue;

      const hsl = rgbToHsl(r, g, b);
      const vibrancy = hsl.s * (1 - Math.abs(hsl.l - 0.5) * 2);

      sumR += r;
      sumG += g;
      sumB += b;
      sumLightness += hsl.l;
      sumSaturation += hsl.s;
      count += 1;

      if (hsl.s > 0.12) {
        const bucket = Math.floor(hsl.h / 30) % bucketCount;
        const weight = hsl.s * (0.6 + 0.4 * (1 - Math.abs(hsl.l - 0.5) * 2));
        buckets[bucket].weight += weight;
        buckets[bucket].r += r * weight;
        buckets[bucket].g += g * weight;
        buckets[bucket].b += b * weight;
      }

      if (hsl.s < 0.2 && hsl.l > 0.15 && hsl.l < 0.9) {
        mutedR += r;
        mutedG += g;
        mutedB += b;
        mutedCount += 1;
      }

      if (vibrancy > vibrantScore) {
        vibrantScore = vibrancy;
        vibrantColor = { r, g, b };
      }
    }

    if (count === 0) return null;

    const avgLightness = sumLightness / count;
    const avgSaturation = sumSaturation / count;

    let dominant: Rgb | null = null;
    let bestBucket = buckets[0];
    for (const bucket of buckets) {
      if (bucket.weight > bestBucket.weight) {
        bestBucket = bucket;
      }
    }

    if (bestBucket.weight > 0) {
      dominant = {
        r: Math.round(bestBucket.r / bestBucket.weight),
        g: Math.round(bestBucket.g / bestBucket.weight),
        b: Math.round(bestBucket.b / bestBucket.weight),
      };
    } else {
      dominant = {
        r: Math.round(sumR / count),
        g: Math.round(sumG / count),
        b: Math.round(sumB / count),
      };
    }

    const dominantColor = dominant ?? { r: 0, g: 0, b: 0 };
    const muted = mutedCount > 0
      ? {
          r: Math.round(mutedR / mutedCount),
          g: Math.round(mutedG / mutedCount),
          b: Math.round(mutedB / mutedCount),
        }
      : dominantColor;

    const accent = vibrantColor ?? dominantColor;
    const dominantHsl = rgbToHsl(dominantColor.r, dominantColor.g, dominantColor.b);
    const accentHsl = rgbToHsl(accent.r, accent.g, accent.b);

    const palette: ColorPalette = {
      dominant: rgbToHex(dominantColor),
      accent: rgbToHex(accent),
      muted: muted ? rgbToHex(muted) : undefined,
      vibrant: accent ? rgbToHex(accent) : undefined,
      sourceImageLightness: clamp(avgLightness, 0, 1),
      sourceImageSaturation: clamp(avgSaturation, 0, 1),
      dominantHue: dominantHsl.h,
    };

    return {
      palette,
      avgLightness,
      avgSaturation,
      dominantHueAngle: dominantHsl.h,
      accentHueAngle: accentHsl.h,
      accentSaturation: accentHsl.s,
    };
  } catch (error) {
    console.warn("Color sampling failed:", error);
    return null;
  }
}

export async function extractColorPaletteFromImage(src: string): Promise<ColorPalette | null> {
  const stats = await sampleImageColors(src);
  return stats?.palette ?? null;
}

export async function extractColorSignatureFromImage(src: string): Promise<{
  palette: ColorPalette;
  signature: ColorSignature;
} | null> {
  const stats = await sampleImageColors(src);
  if (!stats) return null;

  const dominantRgb = stats.palette.dominant
    ? stats.palette.dominant
    : "#000000";
  const dominantHsl = rgbToHsl(
    parseInt(dominantRgb.slice(1, 3), 16),
    parseInt(dominantRgb.slice(3, 5), 16),
    parseInt(dominantRgb.slice(5, 7), 16),
  );

  const dominantHue = dominantHsl.s < NEUTRAL_SATURATION
    ? "neutral"
    : hueToBucket(dominantHsl.h);
  const accentHue = stats.accentSaturation > ACCENT_SATURATION
    ? hueToBucket(stats.accentHueAngle)
    : undefined;

  const accentDominant =
    stats.accentSaturation > ACCENT_SATURATION &&
    (dominantHue === "neutral" || hueDistance(stats.accentHueAngle, dominantHsl.h) > 35);

  const primaryHue = accentDominant ? (accentHue ?? dominantHue) : dominantHue;
  const primaryHueAngle = accentDominant ? stats.accentHueAngle : dominantHsl.h;

  const strengthSample = Math.max(stats.avgSaturation, stats.accentSaturation * 0.8);

  const signature: ColorSignature = {
    dominantHue: primaryHue,
    dominantHueAngle: primaryHueAngle,
    accentHue,
    accentHueAngle: stats.accentHueAngle,
    brightness: classifyBrightness(stats.avgLightness),
    accentStrength: classifyStrength(strengthSample),
    dominantColor: stats.palette.dominant,
    accentColor: stats.palette.accent,
  };

  return { palette: stats.palette, signature };
}
