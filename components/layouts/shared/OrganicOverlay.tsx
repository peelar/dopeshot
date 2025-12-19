import { memo, useMemo } from "react";

interface OrganicOverlayProps {
  enabled?: boolean;
  /**
   * Allows layouts to tune the luminance modulation without exposing a UI control.
   * Values around 1 are default; lower values soften the field, higher values add contrast.
   */
  intensity?: number;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateValueNoise(size: number, gridSize: number, rand: () => number) {
  const grid = new Float32Array((gridSize + 1) * (gridSize + 1));
  for (let i = 0; i < grid.length; i++) {
    grid[i] = rand();
  }

  const sample = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const topLeft = grid[yi * (gridSize + 1) + xi];
    const topRight = grid[yi * (gridSize + 1) + xi + 1];
    const bottomLeft = grid[(yi + 1) * (gridSize + 1) + xi];
    const bottomRight = grid[(yi + 1) * (gridSize + 1) + xi + 1];

    const top = topLeft * (1 - xf) + topRight * xf;
    const bottom = bottomLeft * (1 - xf) + bottomRight * xf;
    return top * (1 - yf) + bottom * yf;
  };

  const data = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * gridSize;
      const ny = (y / size) * gridSize;
      data[y * size + x] = sample(nx, ny);
    }
  }
  return data;
}

function generateOrganicTexture(size: number, seed: number, intensity: number) {
  if (typeof document === "undefined") return null;

  const rand = mulberry32(seed);
  const base = generateValueNoise(size, 5, rand);
  const mid = generateValueNoise(size, 10, rand);
  const low = generateValueNoise(size, 3, rand);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < base.length; i++) {
    const blended = base[i] * 0.55 + mid[i] * 0.3 + low[i] * 0.15;
    const centered = (blended - 0.5) * 0.65 * Math.max(0.4, Math.min(1.6, intensity));
    const value = Math.max(0, Math.min(255, Math.round(128 + centered * 255)));
    imageData.data[i * 4] = value;
    imageData.data[i * 4 + 1] = value;
    imageData.data[i * 4 + 2] = value;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  const blurred = document.createElement("canvas");
  blurred.width = size;
  blurred.height = size;
  const blurCtx = blurred.getContext("2d");
  if (!blurCtx) return null;
  blurCtx.filter = "blur(12px) contrast(115%) brightness(1.02)";
  blurCtx.drawImage(canvas, 0, 0);

  return blurred.toDataURL("image/png");
}

function OrganicOverlayComponent({ enabled = true, intensity = 1 }: OrganicOverlayProps) {
  const texture = useMemo(() => {
    if (!enabled) return null;
    const clampedIntensity = Math.max(0.35, Math.min(1.5, intensity));
    const primary = generateOrganicTexture(480, 7, clampedIntensity);
    const secondary = generateOrganicTexture(360, 13, clampedIntensity * 0.85);
    if (!primary || !secondary) return null;
    return { primary, secondary };
  }, [enabled, intensity]);

  if (!enabled || !texture) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${texture.primary}"), url("${texture.secondary}")`,
          backgroundSize: "180% 180%, 140% 140%",
          backgroundPosition: "20% 30%, 70% 60%",
          backgroundRepeat: "no-repeat, no-repeat",
          opacity: 0.28,
          mixBlendMode: "soft-light",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.035)",
          mixBlendMode: "luminosity",
        }}
      />
    </div>
  );
}

export const OrganicOverlay = memo(OrganicOverlayComponent);
