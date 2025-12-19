import { memo, useMemo } from "react";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { OrganicOverlay } from "@/components/layouts/shared/OrganicOverlay";
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

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // convert to 32bit int
  }
  return Math.abs(hash);
}

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
): { accent: RGB; secondary: RGB; base: RGB; variant: number } {
  const accentColor = palette?.accent || palette?.vibrant || tokenToCssColor(config.colors.accent);
  const secondaryColor =
    palette?.muted || palette?.dominant || tokenToCssColor(config.colors.background);
  const baseColor = tokenToCssColor(config.colors.background);

  const accentRgb = parseColorToRgb(accentColor) || [244, 114, 182]; // fallback pink
  const secondaryRgb = parseColorToRgb(secondaryColor) || [251, 191, 36]; // fallback amber
  const baseRgb = parseColorToRgb(baseColor) || [24, 24, 27]; // fallback dark neutral

  const seedSource = `${accentColor}-${secondaryColor}-${baseColor}`;
  const variant = hashString(seedSource) % 3;

  return { accent: accentRgb, secondary: secondaryRgb, base: baseRgb, variant };
}

function GridOverlay({ config, palette }: { config: LayoutConfig; palette?: ColorPalette }) {
  const { base } = getPaletteColors(config, palette);
  const line = toRgba(mixWithWhite(base, 0.3), 0.12);
  const highlight = toRgba(mixWithWhite(base, 0.4), 0.06);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, ${line}, ${line} 1px, transparent 1px, transparent 120px),
            repeating-linear-gradient(90deg, ${line}, ${line} 1px, transparent 1px, transparent 120px),
            repeating-linear-gradient(0deg, ${highlight}, ${highlight} 1px, transparent 1px, transparent 60px),
            repeating-linear-gradient(90deg, ${highlight}, ${highlight} 1px, transparent 1px, transparent 60px)
          `,
          backgroundSize: "120px 120px, 120px 120px, 60px 60px, 60px 60px",
          mixBlendMode: "luminosity",
          opacity: 0.18,
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
    return <GrainOverlay enabled intensity={0.95} />;
  }

  if (resolvedPattern === "organic") {
    return <OrganicOverlay enabled intensity={0.92} />;
  }

  if (resolvedPattern === "grid") {
    return <GridOverlay config={config} palette={screenshot?.colorPalette} />;
  }

  return null;
}

export const PatternOverlay = memo(PatternOverlayComponent);
