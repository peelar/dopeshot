import { memo, useMemo } from "react";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { resolvePatternChoice } from "@/domain/layout/patterns";
import type { Asset, ColorPalette } from "@/domain/asset/types";
import type { LayoutConfig, PatternChoice } from "@/domain/layout/types";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";

type RGB = [number, number, number];

interface PatternOverlayProps {
  config: LayoutConfig;
  assets?: Asset[];
  assetMap?: Map<string, Asset>;
  screenshotAsset?: Asset | null;
}

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));

function parseColorToRgb(color: string): RGB | null {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b];
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b];
    }
  }

  const rgbMatch = color.match(/rgb[a]?\s*\(([^)]+)\)/i);
  if (rgbMatch?.[1]) {
    const parts = rgbMatch[1]
      .split(/[,\s]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((v) => Number(v));
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      return [parts[0], parts[1], parts[2]];
    }
  }

  return null;
}

function mixWithWhite(rgb: RGB, factor: number): RGB {
  return [
    clamp(Math.round(rgb[0] + (255 - rgb[0]) * factor)),
    clamp(Math.round(rgb[1] + (255 - rgb[1]) * factor)),
    clamp(Math.round(rgb[2] + (255 - rgb[2]) * factor)),
  ];
}

function toRgba(rgb: RGB, alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function getPaletteColors(
  config: LayoutConfig,
  palette?: ColorPalette,
): { secondary: RGB } {
  const secondaryColor =
    palette?.muted || palette?.dominant || tokenToCssColor(config.colors.background);

  const secondaryRgb = parseColorToRgb(secondaryColor) || [251, 191, 36]; // fallback amber

  return { secondary: secondaryRgb };
}


function GridOverlay({ config, palette }: { config: LayoutConfig; palette?: ColorPalette }) {
  const { secondary } = getPaletteColors(config, palette);
  const stroke = toRgba(mixWithWhite(secondary, 0.12), 0.28);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 49%, ${stroke} 49%, ${stroke} 51%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, ${stroke} 49%, ${stroke} 51%, transparent 51%)
          `,
          backgroundSize: "40px 40px",
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  );
}

function PatternOverlayComponent({
  config,
  assets,
  assetMap: providedAssetMap,
  screenshotAsset,
}: PatternOverlayProps) {
  const fallbackAssetMap = useMemo(() => {
    return new Map((assets ?? []).map((a) => [a.id, a]));
  }, [assets]);
  const assetMap = providedAssetMap ?? fallbackAssetMap;

  const screenshot =
    screenshotAsset ??
    (assetMap?.get(config.assets.screenshot || "") as Asset | undefined) ??
    null;

  const resolvedPattern: PatternChoice = useMemo(() => {
    return resolvePatternChoice(config, screenshot?.colorPalette);
  }, [config, screenshot?.colorPalette]);

  if (resolvedPattern === "none") {
    return null;
  }

  if (resolvedPattern === "grain") {
    return <GrainOverlay enabled />;
  }

  if (resolvedPattern === "grid") {
    return <GridOverlay config={config} palette={screenshot?.colorPalette} />;
  }

  return null;
}

export const PatternOverlay = memo(PatternOverlayComponent);
