import type { VignetteEffect } from "../_types";

type VignetteStops = {
  innerStop: number;
  outerStop: number;
  strength: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

export function getVignetteStops(effect: VignetteEffect): VignetteStops {
  const radius = clamp01(effect.radius);
  const softness = clamp01(effect.softness);
  const strength = clamp01(effect.strength);

  const innerStop = lerp(35, 70, radius);
  const feather = lerp(15, 45, softness);
  const outerStop = Math.min(100, innerStop + feather);

  return {
    innerStop,
    outerStop,
    strength,
  };
}

export function buildVignetteGradient(effect: VignetteEffect): string {
  const { innerStop, outerStop, strength } = getVignetteStops(effect);
  const edgeColor = effect.mode === "lighten" ? "255, 255, 255" : "0, 0, 0";
  const transparent = `rgba(${edgeColor}, 0)`;
  const edge = `rgba(${edgeColor}, ${strength.toFixed(3)})`;

  return `radial-gradient(circle at center, ${transparent} 0%, ${transparent} ${innerStop}%, ${edge} ${outerStop}%, ${edge} 100%)`;
}
