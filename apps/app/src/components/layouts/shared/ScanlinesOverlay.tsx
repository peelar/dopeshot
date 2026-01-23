import { memo } from "react";

interface ScanlinesOverlayProps {
  enabled?: boolean;
  /** Intensity of the scanlines effect, from 0 to 1. Defaults to 0.3. */
  intensity?: number;
}

/**
 * CRT-style scanlines overlay for the hacker personality.
 * Creates horizontal lines that give a retro terminal feel.
 */
function ScanlinesOverlayComponent({ enabled = true, intensity = 0.3 }: ScanlinesOverlayProps) {
  if (!enabled) {
    return null;
  }

  // Scale opacity based on intensity
  const lineOpacity = 0.03 + intensity * 0.1; // 0.03 to 0.13

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, ${lineOpacity}) 2px,
            rgba(0, 0, 0, ${lineOpacity}) 4px
          )`,
          mixBlendMode: "multiply",
        }}
      />
      {/* Subtle green tint for terminal vibes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(0, 255, 0, ${intensity * 0.02})`,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}

export const ScanlinesOverlay = memo(ScanlinesOverlayComponent);
