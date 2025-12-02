import { memo } from "react";

const COARSE_GRAIN_TEXTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cfilter id='coarse' x='0' y='0' width='1' height='1'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='4' seed='9' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 2.8 -1.1'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23coarse)' fill='%23000'/%3E%3C/svg%3E";

const FINE_GRAIN_TEXTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cfilter id='fine' x='0' y='0' width='1' height='1'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.6' numOctaves='5' seed='21' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 2.4 -0.7'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23fine)' fill='%23000'/%3E%3C/svg%3E";

interface GrainOverlayProps {
  enabled?: boolean;
}

function GrainOverlayComponent({ enabled = true }: GrainOverlayProps) {
  if (!enabled) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${COARSE_GRAIN_TEXTURE}")`,
          backgroundSize: "120px 120px",
          mixBlendMode: "multiply",
          opacity: 0.35,
          filter: "contrast(220%) brightness(0.9)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${FINE_GRAIN_TEXTURE}")`,
          backgroundSize: "50px 50px",
          mixBlendMode: "screen",
          opacity: 0.2,
          filter: "contrast(240%) brightness(1.15)",
        }}
      />
    </div>
  );
}

export const GrainOverlay = memo(GrainOverlayComponent);
