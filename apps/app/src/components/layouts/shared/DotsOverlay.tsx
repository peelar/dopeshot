import { memo } from "react";

interface DotsOverlayProps {
  enabled?: boolean;
  /** Intensity of the dot grid effect, from 0 to 1. Defaults to 0.4. */
  intensity?: number;
}

/**
 * Pixel dot-grid overlay for the retro personality.
 * Creates a repeating pattern of small dots that evoke a pixel grid / dot matrix.
 */
function DotsOverlayComponent({ enabled = true, intensity = 0.4 }: DotsOverlayProps) {
  if (!enabled) {
    return null;
  }

  const dotOpacity = 0.04 + intensity * 0.12; // 0.04 to 0.16

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, ${dotOpacity}) 1px, transparent 1px)`,
          backgroundSize: "4px 4px",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}

export const DotsOverlay = memo(DotsOverlayComponent);
