import { memo, useEffect, useState } from "react";

// Fallback SVG noise (used if canvas is unavailable, e.g. during SSR)
const FALLBACK_COARSE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch' seed='9'/%3E%3C/filter%3E%3Crect width='64' height='64' filter='url(%23noise)' fill='%23000'/%3E%3C/svg%3E";
const FALLBACK_FINE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='5' stitchTiles='stitch' seed='21'/%3E%3C/filter%3E%3Crect width='64' height='64' filter='url(%23noise)' fill='%23000'/%3E%3C/svg%3E";

function generateNoiseDataUrl(size: number, alpha: number) {
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
  const mulberry32 = (seed: number) => {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const rand = mulberry32(123456789 + size + Math.round(alpha * 1000));

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const clampedAlpha = Math.max(0, Math.min(255, Math.round(255 * alpha)));

  for (let i = 0; i < data.length; i += 4) {
    const value = 90 + rand() * 120; // mid-tones to avoid heavy darkening
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = clampedAlpha;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

interface GrainOverlayProps {
  enabled?: boolean;
  isStatic?: boolean; // kept for API compatibility
}

function GrainOverlayComponent({ enabled = true }: GrainOverlayProps) {
  if (!enabled) {
    return null;
  }

  const [noise, setNoise] = useState<{ coarseUrl: string; fineUrl: string } | null>(null);

  useEffect(() => {
    const coarse = generateNoiseDataUrl(96, 0.22);
    const fine = generateNoiseDataUrl(48, 0.16);
    setNoise({
      coarseUrl: coarse ?? FALLBACK_COARSE,
      fineUrl: fine ?? FALLBACK_FINE,
    });
  }, []);

  if (!noise) {
    // Avoid hydration mismatches: render nothing until noise is ready on client
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${noise.coarseUrl}"), url("${noise.fineUrl}")`,
          backgroundSize: "120px 120px, 56px 56px",
          opacity: 0.32,
          filter: "contrast(220%) brightness(1.02)",
          mixBlendMode: "normal",
        }}
      />
    </div>
  );
}

export const GrainOverlay = memo(GrainOverlayComponent);
