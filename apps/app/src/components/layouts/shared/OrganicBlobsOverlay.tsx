import { memo, useMemo, useId } from "react";
import type { LayoutConfig } from "@/domain/layout/types";
import { isAdvancedGradient, isLegacyGradient } from "@/domain/layout/gradients";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";
import { generateOrganicBlobPath } from "@/domain/layout/patterns/organic-blobs";

function getTwoColorsFromConfig(config: LayoutConfig): [string, string] {
  if (config.background?.type !== "gradient") {
    const bg = tokenToCssColor(config.colors.background);
    const accent = tokenToCssColor(config.colors.accent);
    return [bg, accent];
  }

  const gradient = config.background.customGradient;

  if (!gradient) {
    const bg = tokenToCssColor(config.colors.background);
    const accent = tokenToCssColor(config.colors.accent);
    return [bg, accent];
  }

  if (isAdvancedGradient(gradient)) {
    const colors = gradient.stops.map((stop) => stop.color).filter(Boolean);
    if (colors.length >= 2) return [colors[0]!, colors[colors.length - 1]!];
    if (colors.length === 1) return [colors[0]!, colors[0]!];
  }

  if (isLegacyGradient(gradient)) {
    return [gradient.from, gradient.to];
  }

  return ["#ffffff", "#ffffff"];
}

interface OrganicBlobsOverlayProps {
  config: LayoutConfig;
}

function OrganicBlobsOverlayComponent({ config }: OrganicBlobsOverlayProps) {
  const [primary, secondary] = useMemo(() => getTwoColorsFromConfig(config), [config]);
  const variantKey = config.background?.patternVariant ?? "v1";
  const maskId = useId();

  // Determine layout variant to adjust blob positions
  // "left" variant = content left, screenshot right -> put blobs on left
  // "right" variant = content right, screenshot left -> put blobs on right
  // "center" variant = balanced -> diagonal blobs
  const layoutVariant = config.variant || "center";

  const blobPositions = useMemo(() => {
    switch (layoutVariant) {
      case "left":
        return {
          a: { x: 10, y: 20 }, // Top Left
          b: { x: 25, y: 85 }, // Bottom Left
        };
      case "right":
        return {
          a: { x: 90, y: 20 }, // Top Right
          b: { x: 75, y: 85 }, // Bottom Right
        };
      case "center":
      default:
        return {
          a: { x: 96, y: 14 }, // Top Right
          b: { x: 10, y: 92 }, // Bottom Left
        };
    }
  }, [layoutVariant]);

  const blobA = useMemo(
    () =>
      generateOrganicBlobPath({
        seed: `organic-blobs:${variantKey}:${primary}:${secondary}:a`,
        center: blobPositions.a,
        radius: 54,
        distortion: 0.22,
      }),
    [primary, secondary, variantKey, blobPositions.a],
  );

  const blobB = useMemo(
    () =>
      generateOrganicBlobPath({
        seed: `organic-blobs:${variantKey}:${primary}:${secondary}:b`,
        center: blobPositions.b,
        radius: 58,
        distortion: 0.24,
      }),
    [primary, secondary, variantKey, blobPositions.b],
  );

  const blobBTransform = useMemo(() => {
    const { x, y } = blobPositions.b;
    // Rotate around the center of the blob
    return `translate(${x} ${y}) rotate(45) scale(0.92) translate(-${x} -${y})`;
  }, [blobPositions.b]);

  const shouldMaskTop = config.layoutId.startsWith("popup-gradient");
  const maskUrl = shouldMaskTop ? `url(#${maskId}-mask)` : undefined;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1]"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {shouldMaskTop ? (
        <defs>
          <linearGradient id={`${maskId}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="black" />
            <stop offset="40%" stopColor="black" />
            <stop offset="48%" stopColor="white" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
          <mask id={`${maskId}-mask`}>
            <rect x="0" y="0" width="100" height="100" fill={`url(#${maskId}-fade)`} />
          </mask>
        </defs>
      ) : null}
      <g mask={maskUrl}>
        <path d={blobA} fill={primary} opacity={0.1} />
        <path d={blobB} fill={secondary} opacity={0.2} transform={blobBTransform} />
      </g>
    </svg>
  );
}

export const OrganicBlobsOverlay = memo(OrganicBlobsOverlayComponent);
