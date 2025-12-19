import { memo, useMemo } from "react";

interface GrainOverlayProps {
  enabled?: boolean;
  isStatic?: boolean; // kept for API compatibility
  /**
   * Adjusts the overall strength of the grain overlay without exposing a user-facing control.
   * Values closer to 0 soften the texture, values above 1 make it more pronounced.
   */
  intensity?: number;
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

function GrainOverlayComponent({ enabled = true, intensity = 1 }: GrainOverlayProps) {
  const noise = useMemo(() => {
    if (!enabled) return null;
    const intensityScale = Math.max(0, intensity);
    const coarse = generateNoiseDataUrl(48, 0.32 * intensityScale, 1, 118, 150);
    const fine = generateNoiseDataUrl(24, 0.2 * intensityScale, 2, 126, 130);
    if (!coarse || !fine) return null;
    return {
      coarseUrl: coarse,
      fineUrl: fine,
    };
  }, [enabled, intensity]);

  if (!enabled || !noise) {
    return null;
  }

  const clampedIntensity = Math.max(0.35, Math.min(1.65, intensity));
  const opacity = 0.15 * clampedIntensity;
  const contrast = 170 + 40 * clampedIntensity;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${noise.coarseUrl}"), url("${noise.fineUrl}")`,
          backgroundSize: "48px 48px, 24px 24px",
          opacity,
          filter: `contrast(${contrast}%) brightness(1.05)`,
          mixBlendMode: "luminosity",
          imageRendering: "pixelated",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  );
}

export const GrainOverlay = memo(GrainOverlayComponent);
