import type { ColorPalette } from "@/domain/asset/types";
import { hexToRgba } from "@/domain/layout/gradients/utils";
import type { BlobOverlayEffect, BlobPlacement } from "../_types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

const fnv1a = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const buildRandom = (seed: number, salt: string) => mulberry32(fnv1a(`${seed}:${salt}`));

type BlobSpec = {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  blurPx: number;
  feather: number;
};

type BlobMeta = {
  paletteAccent: string[];
  placement: BlobPlacement;
};

type BlobOverlayResult = {
  specs: BlobSpec[];
  meta: BlobMeta;
};

type GenerateBlobsOptions = {
  seed: number;
  count: number;
  frameW: number;
  frameH: number;
  palette: ColorPalette;
  params: BlobOverlayEffect;
};

const DEFAULT_FEATHER_STOPS = [0.42, 0.74];

const mapSoftness = (softness: number) => {
  const clamped = clamp01(softness);
  const blur = lerp(6, 48, clamped);
  const featherInner = lerp(DEFAULT_FEATHER_STOPS[0], 0.22, clamped);
  const featherOuter = lerp(DEFAULT_FEATHER_STOPS[1], 0.9, clamped);
  return { blur, featherInner, featherOuter };
};

const choosePlacement = (placement: BlobPlacement, count: number) => {
  if (placement === "corners") {
    return count === 1
      ? ["top-left"]
      : count === 2
        ? ["top-left", "bottom-right"]
        : ["top-left", "bottom-right", "top-right"];
  }

  if (placement === "randomBalanced") {
    return count === 1
      ? ["random"]
      : count === 2
        ? ["random", "random"]
        : ["random", "random", "random"];
  }

  return count === 1
    ? ["top-right"]
    : count === 2
      ? ["top-right", "bottom-left"]
      : ["top-right", "bottom-left", "bottom-right"];
};

const pickPaletteAccents = (palette: ColorPalette) => {
  const accents = [palette.vibrant, palette.accent, palette.dominant, palette.muted].filter(
    Boolean,
  ) as string[];
  const [first, second] = accents.length >= 2 ? accents : [palette.accent, palette.vibrant];
  return [first, second ?? first];
};

const mapStrengthAlpha = (strength: number, weight: number) => {
  const normalized = clamp01(strength);
  return clamp(normalized * weight, 0.05, 0.75);
};

const mapScaleRange = (scale: number, minFrame: number) => {
  const clamped = clamp01(scale);
  const max = lerp(0.52, 0.85, clamped) * minFrame;
  const mid = lerp(0.34, 0.62, clamped) * minFrame;
  const min = lerp(0.24, 0.46, clamped) * minFrame;
  return { max, mid, min };
};


const applyPlacement = (
  slot: string,
  random: () => number,
  frameW: number,
  frameH: number,
) => {
  const insetX = frameW * 0.08;
  const insetY = frameH * 0.08;
  const offscreen = frameW * 0.08;

  switch (slot) {
    case "top-left":
      return { x: insetX - offscreen, y: insetY };
    case "top-right":
      return { x: frameW - insetX + offscreen, y: insetY - offscreen * 0.6 };
    case "bottom-left":
      return { x: insetX - offscreen * 0.6, y: frameH - insetY + offscreen };
    case "bottom-right":
      return { x: frameW - insetX + offscreen, y: frameH - insetY + offscreen * 0.4 };
    case "edge-top":
      return { x: frameW * 0.5, y: insetY - offscreen * 0.6 };
    case "edge-bottom":
      return { x: frameW * 0.5, y: frameH - insetY + offscreen * 0.6 };
    default:
      return {
        x: lerp(frameW * 0.12, frameW * 0.88, random()),
        y: lerp(frameH * 0.12, frameH * 0.88, random()),
      };
  }
};

const ensureSpacing = (
  positions: { x: number; y: number }[],
  candidate: { x: number; y: number },
  minDistance: number,
  random: () => number,
  frameW: number,
  frameH: number,
) => {
  if (positions.length === 0) return candidate;

  const tooClose = positions.some((point) => {
    const dx = point.x - candidate.x;
    const dy = point.y - candidate.y;
    return Math.sqrt(dx * dx + dy * dy) < minDistance;
  });

  if (!tooClose) return candidate;

  return {
    x: lerp(frameW * 0.1, frameW * 0.9, random()),
    y: lerp(frameH * 0.1, frameH * 0.9, random()),
  };
};

export function generateBlobs(options: GenerateBlobsOptions): BlobOverlayResult {
  const { seed, count, frameW, frameH, palette, params } = options;
  const normalizedCount = clamp(Math.round(count), 1, 3);
  const random = buildRandom(seed, `${palette.dominant}:${palette.accent}`);
  const { max, mid, min } = mapScaleRange(params.scale, Math.min(frameW, frameH));
  const { blur, featherInner, featherOuter } = mapSoftness(params.softness);
  const [primary, secondary] = pickPaletteAccents(palette);
  const placementSlots = choosePlacement(params.placement, normalizedCount);

  const specs: BlobSpec[] = [];
  const positions: { x: number; y: number }[] = [];
  const minDistance = Math.min(frameW, frameH) * 0.35;

  placementSlots.forEach((slot, index) => {
    const base = applyPlacement(slot, random, frameW, frameH);
    const candidate = ensureSpacing(positions, base, minDistance, random, frameW, frameH);
    positions.push(candidate);

    const radius = index === 0
      ? lerp(mid, max, 0.65 + random() * 0.25)
      : index === 1
        ? lerp(min, mid, 0.5 + random() * 0.35)
        : lerp(min * 0.7, min, 0.55 + random() * 0.3);

    const alpha = mapStrengthAlpha(params.strength, index === 0 ? 1 : index === 1 ? 0.7 : 0.5);
    const color = index === 0 ? primary : index === 1 ? secondary : primary;
    const jitter = (random() - 0.5) * radius * 0.2;

    specs.push({
      x: clamp((candidate.x + jitter) / frameW, 0, 1),
      y: clamp((candidate.y - jitter * 0.6) / frameH, 0, 1),
      radius,
      color: hexToRgba(color, alpha),
      alpha,
      blurPx: blur,
      feather: featherInner + random() * (featherOuter - featherInner),
    });
  });

  return {
    specs,
    meta: {
      paletteAccent: [primary, secondary],
      placement: params.placement,
    },
  };
}

export function buildBlobGradient(blob: BlobSpec): string {
  const innerStop = Math.round(blob.feather * 100);
  const outerStop = Math.round(Math.min(1, blob.feather + 0.22) * 100);
  const transparent = blob.color.replace(
    /rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/,
    "rgba($1, $2, $3, 0)",
  );
  return `radial-gradient(circle at center, ${blob.color} 0%, ${blob.color} ${innerStop}%, ${transparent} ${outerStop}%, ${transparent} 100%)`;
}

export type { BlobSpec, BlobOverlayResult };
