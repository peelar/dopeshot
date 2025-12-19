import { memo, useEffect, useMemo, useState } from "react";
import type { PatternIntensity } from "@/domain/layout/patterns";

interface GrainOverlayProps {
  enabled?: boolean;
  intensity?: PatternIntensity;
  isStatic?: boolean; // kept for API compatibility
}

function generateNoiseDataUrl(
  size: number,
  alpha: number,
  seed = 1,
  mean = 120,
  spread = 180,
) {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  // Deterministic RNG so re-hydration is stable
  const mulberry32 = (seedValue: number) => {
    return () => {
      let t = (seedValue += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const rand = mulberry32(123456789 + size + Math.round(alpha * 1000) + seed * 31);

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const clampedAlpha = Math.max(0, Math.min(255, Math.round(255 * alpha)));

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.max(0, Math.min(255, mean + (rand() - 0.5) * spread));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = clampedAlpha;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

const intensityLookup: Record<PatternIntensity, { opacity: number; contrast: number; brightness: number }> = {
  low: { opacity: 0.12, contrast: 140, brightness: 1.02 },
  medium: { opacity: 0.18, contrast: 170, brightness: 1.05 },
  high: { opacity: 0.24, contrast: 190, brightness: 1.08 },
};

function GrainOverlayComponent({ enabled = true, intensity = "medium" }: GrainOverlayProps) {
  const [noise, setNoise] = useState<{ coarseUrl: string; fineUrl: string } | null>(null);

  const tuning = useMemo(() => intensityLookup[intensity], [intensity]);

  useEffect(() => {
    if (!enabled) return;
    const coarse = generateNoiseDataUrl(48, 0.38, 1, 118, 150);
    const fine = generateNoiseDataUrl(24, 0.24, 2, 126, 130);
    setNoise({
      coarseUrl: coarse || "",
      fineUrl: fine || "",
    });
  }, [enabled]);

  if (!enabled || !noise) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${noise.coarseUrl}"), url("${noise.fineUrl}")`,
          backgroundSize: "48px 48px, 24px 24px",
          opacity: tuning.opacity,
          filter: `contrast(${tuning.contrast}%) brightness(${tuning.brightness})`,
          mixBlendMode: "normal",
          imageRendering: "pixelated",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          mixBlendMode: "normal",
        }}
      />
    </div>
  );
}

export const GrainOverlay = memo(GrainOverlayComponent);
