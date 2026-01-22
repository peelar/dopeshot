import type { CSSProperties } from "react";
import type { GrainBlendMode, GrainEffect } from "../_types";

type GrainStyleResult = {
  style: CSSProperties;
  meta: {
    baseFrequency: string;
    opacity: number;
    seed?: number;
    blendMode: GrainBlendMode;
    backgroundSize: string;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);

const buildSvgNoise = (baseFrequency: string, seed?: number) => {
  const seedAttribute = typeof seed === "number" ? ` seed='${seed}'` : "";
  return `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
    <filter id='n'>
      <feTurbulence
        type='fractalNoise'
        baseFrequency='${baseFrequency}'
        numOctaves='2'
        stitchTiles='stitch'${seedAttribute}
      />
      <feColorMatrix type='saturate' values='0' />
    </filter>
    <rect width='120' height='120' filter='url(#n)' />
  </svg>`;
};

const encodeSvg = (svg: string) =>
  svg
    .replace(/\n/g, "")
    .replace(/\s+/g, " ")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "%22")
    .replace(/'/g, "%27");

const buildBaseFrequency = (scale: number) => {
  const normalized = clamp(scale, 0, 1);
  const frequency = mapRange(normalized, 0, 1, 0.9, 0.25);
  const axis = frequency.toFixed(3);
  return `${axis} ${axis}`;
};

const buildOpacity = (amount: number) => {
  const normalized = clamp(amount, 0, 1);
  return normalized * 0.35;
};

export function buildGrainStyles(effect: GrainEffect): GrainStyleResult {
  const baseFrequency = buildBaseFrequency(effect.scale);
  const opacity = buildOpacity(effect.amount);
  const seed = effect.useSeed ? effect.seed : undefined;
  const svg = buildSvgNoise(baseFrequency, seed);
  const encoded = encodeSvg(svg);

  const backgroundSize = "160px 160px";

  return {
    style: {
      backgroundImage: `url("data:image/svg+xml,${encoded}")`,
      backgroundRepeat: "repeat",
      backgroundSize,
      opacity,
      mixBlendMode: effect.blendMode,
    },
    meta: {
      baseFrequency,
      opacity,
      seed,
      blendMode: effect.blendMode,
      backgroundSize,
    },
  };
}
