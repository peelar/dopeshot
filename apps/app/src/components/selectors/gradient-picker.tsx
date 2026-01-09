"use client";

import { useMemo, useCallback, useRef, useEffect, type CSSProperties } from "react";
import { useAtomValue } from "jotai";
import {
  BackgroundConfig,
  ColorToken,
  CustomGradient,
  isAdvancedGradient,
  isLegacyGradient,
} from "@/domain/layout/types";
import { customGradientToCss, generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import { getColorSourceType } from "@/domain/layout/gradients/color-source";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { configAtom, isAnalyzingColorsAtom } from "@/hooks/atoms";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";
import { tokenToCssColor } from "@/components/layouts/shared/color-utils";
import {
  createMetricPatternSvgDataUrl,
  METRIC_PATTERN_MASK,
  normalizeCssRgbForSvg,
  parseMetricSeed,
} from "@/components/layouts/shared/metric-patterns";

interface GradientPickerProps {
  onChangeAction: (background: BackgroundConfig, textColor: ColorToken) => void;
  variant?: "default" | "inline";
}

export function GradientPicker({ onChangeAction, variant = "default" }: GradientPickerProps) {
  const config = useAtomValue(configAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);
  const background =
    config.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
  const colorPalette = screenshotAsset?.colorPalette;
  const hasScreenshot = Boolean(config.assets?.screenshot);

  // Generate multi-stop gradients from screenshot colors
  const dynamicGradients = useMemo((): CustomGradient[] => {
    if (!colorPalette) return [];

    // Use landscape as default aspect for picker (actual gradient uses correct aspect from page.tsx)
    return generateGradientOptions(colorPalette, {
      aspectCategory: "landscape",
      variant: undefined,
    });
  }, [colorPalette]);

  const hasScreenshotGradients = dynamicGradients.length > 0;
  const displayGradients = useMemo(
    () => {
      // Inline variant (mobile): show first 4 gradients (3 linear + mesh), exclude ambient
      // Default variant (sidebar): show all 6 gradients
      return variant === "inline" ? dynamicGradients.slice(0, 4) : dynamicGradients.slice(0, 6);
    },
    [dynamicGradients, variant],
  );

  const matchesScreenshotGradient = useMemo(() => {
    if (!background.customGradient || !hasScreenshotGradients) return false;
    return dynamicGradients.some((gradient) =>
      areGradientsEqual(gradient, background.customGradient),
    );
  }, [background.customGradient, dynamicGradients, hasScreenshotGradients]);

  const sourceOverrideRef = useRef(false);

  // Auto-apply first screenshot gradient when available
  useEffect(() => {
    if (!hasScreenshot) return;
    if (background.type !== "gradient") return;
    if (!hasScreenshotGradients || dynamicGradients.length === 0) return;
    if (matchesScreenshotGradient) return;

    // Skip auto-apply if user has manually selected a preset or custom gradient
    // Check legacy string format first (handles "preset", "custom", "screenshot")
    if (typeof background.gradientSource === "string") {
      const source = background.gradientSource;
      if (source === "preset" || source === "custom") {
        return;
      }
    }

    // Check new ColorSourceInfo format
    const gradientSourceType = getColorSourceType(background.gradientSource);
    if (
      gradientSourceType === "preset" ||
      gradientSourceType === "manual" ||
      gradientSourceType === "brand"
    ) {
      return;
    }

    // Skip if ref indicates manual override (for backwards compatibility)
    if (sourceOverrideRef.current) return;

    const firstGradient = dynamicGradients[0];
    if (!firstGradient) return;

    const textColor = getTextColorFromGradient(firstGradient);
    const grainEnabled = background.grainEnabled ?? true;
    onChangeAction(
      {
        type: "gradient",
        value: "custom",
        customGradient: firstGradient,
        gradientSource: "screenshot",
        grainEnabled,
      },
      textColor,
    );
  }, [
    background.grainEnabled,
    background.gradientSource,
    background.type,
    dynamicGradients,
    hasScreenshot,
    hasScreenshotGradients,
    matchesScreenshotGradient,
    onChangeAction,
  ]);

  const handleScreenshotSelect = useCallback(
    (gradient: CustomGradient) => {
      sourceOverrideRef.current = true;
      const textColor = getTextColorFromGradient(gradient);
      onChangeAction(
        {
          type: "gradient",
          value: "custom",
          customGradient: gradient,
          gradientSource: "screenshot",
        },
        textColor,
      );
    },
    [onChangeAction],
  );

  const metricSeeds = useMemo(() => [113, 271, 503, 809, 1337, 2024], []);
  const metricBase = tokenToCssColor(config.colors.background);
  const metricPrimary = normalizeCssRgbForSvg(tokenToCssColor(config.colors.accent));

  const metricTextColor = useMemo((): ColorToken => {
    const baseHex = rgbCssToHex(metricBase);
    return getContrastTextColor(baseHex ?? "#0f172a");
  }, [metricBase]);

  const handleMetricSelect = useCallback(
    (seedValue: number) => {
      onChangeAction(
        {
          type: "metric",
          value: String(seedValue),
          customGradient: undefined,
          gradientSource: undefined,
        },
        metricTextColor,
      );
    },
    [metricTextColor, onChangeAction],
  );

  if (variant === "inline") {
    return (
      <div className="space-y-3">
        <ScreenshotGradients
          gradients={displayGradients}
          activeGradient={background.customGradient}
          disabled={!hasScreenshotGradients}
          onSelect={handleScreenshotSelect}
          isLoading={isAnalyzingColors || (!hasScreenshotGradients && hasScreenshot)}
          gridClass="grid-cols-4"
          skeletonCount={4}
        />
        <MetricPatternSwatches
          seeds={metricSeeds}
          activeSeed={background.type === "metric" ? parseMetricSeed(background.value) : undefined}
          baseColor={metricBase}
          primaryColor={metricPrimary}
          onSelect={handleMetricSelect}
          gridClass="grid-cols-4"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/60 bg-muted/30">
        <div className="space-y-3 px-3 pb-3 pt-3">
          <ScreenshotGradients
            gradients={displayGradients}
            activeGradient={background.customGradient}
            disabled={!hasScreenshotGradients}
            onSelect={handleScreenshotSelect}
            isLoading={isAnalyzingColors || (!hasScreenshotGradients && hasScreenshot)}
            gridClass="grid-cols-3"
            skeletonCount={6}
          />
          <div className="pt-2">
            <MetricPatternSwatches
              seeds={metricSeeds}
              activeSeed={background.type === "metric" ? parseMetricSeed(background.value) : undefined}
              baseColor={metricBase}
              primaryColor={metricPrimary}
              onSelect={handleMetricSelect}
              gridClass="grid-cols-3"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScreenshotGradientsProps {
  gradients: CustomGradient[];
  activeGradient?: CustomGradient;
  disabled: boolean;
  onSelect: (gradient: CustomGradient) => void;
  isLoading?: boolean;
  gridClass?: string;
  skeletonCount?: number;
}

function ScreenshotGradients({
  gradients,
  activeGradient,
  disabled,
  onSelect,
  isLoading,
  gridClass = "grid-cols-4",
  skeletonCount = 4,
}: ScreenshotGradientsProps) {
  if (!gradients.length && !isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-border/40 bg-background/50 px-3 py-6 text-center text-xs text-muted-foreground">
        Upload a screenshot to reveal curated gradients.
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3", gridClass)}>
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={`skeleton-${index}`} className="h-12 w-full rounded-lg" />
          ))
        : gradients.map((gradient, index) => {
            const isSelected = areGradientsEqual(activeGradient, gradient);
            return (
              <GradientSwatch
                key={`gradient-${index}`}
                gradientCss={customGradientToCss(gradient)}
                selected={isSelected}
                onClick={() => !disabled && onSelect(gradient)}
                ariaLabel="Screenshot gradient"
              />
            );
          })}
    </div>
  );
}

interface GradientSwatchProps {
  gradientCss?: string;
  style?: CSSProperties;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

function GradientSwatch({ gradientCss, style, selected, onClick, ariaLabel }: GradientSwatchProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group relative flex h-12 w-full items-center overflow-hidden rounded-md p-0 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2",
        selected
          ? "shadow-sm ring-2 ring-foreground/50 ring-offset-1 ring-offset-background"
          : "ring-1 ring-white/15",
      )}
      style={style ?? (gradientCss ? { background: gradientCss } : undefined)}
    >
      <span className="sr-only">Gradient swatch</span>
    </Button>
  );
}

function MetricPatternSwatches({
  seeds,
  activeSeed,
  baseColor,
  primaryColor,
  onSelect,
  gridClass = "grid-cols-3",
}: {
  seeds: number[];
  activeSeed?: number;
  baseColor: string;
  primaryColor: string;
  onSelect: (seed: number) => void;
  gridClass?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">Metric patterns</span>
      </div>
      <div className={cn("grid gap-3", gridClass)}>
        {seeds.map((seed) => {
          const patternUrl = createMetricPatternSvgDataUrl({
            seed,
            width: 360,
            height: 180,
            primaryColor,
            stepPx: 20,
          });

          const isSelected = activeSeed === seed;
          const style: CSSProperties = {
            background: `url("${patternUrl}") center / 100% 100% no-repeat, linear-gradient(135deg, ${baseColor}, ${baseColor})`,
            maskImage: METRIC_PATTERN_MASK,
            WebkitMaskImage: METRIC_PATTERN_MASK,
          };

          return (
            <GradientSwatch
              key={`metric-${seed}`}
              style={style}
              selected={isSelected}
              onClick={() => onSelect(seed)}
              ariaLabel="Metric pattern"
            />
          );
        })}
      </div>
    </div>
  );
}

function areGradientsEqual(a?: CustomGradient, b?: CustomGradient) {
  if (!a || !b) return false;

  // Compare legacy gradients
  if (isLegacyGradient(a) && isLegacyGradient(b)) {
    // Compare colors only - ignore direction since users can adjust angle after selection
    return a.from === b.from && a.to === b.to;
  }

  // Compare advanced gradients
  if (isAdvancedGradient(a) && isAdvancedGradient(b)) {
    if (a.stops.length !== b.stops.length) return false;
    if (a.type !== b.type) return false;

    // Mesh gradients: compare by meshLayers presence
    const aHasMesh = a.meshLayers && a.meshLayers.length > 0;
    const bHasMesh = b.meshLayers && b.meshLayers.length > 0;
    if (aHasMesh !== bHasMesh) return false;

    // If both are mesh gradients, compare layer count
    if (aHasMesh && bHasMesh) {
      if (a.meshLayers!.length !== b.meshLayers!.length) return false;
      // Compare mesh layer colors and positions
      return a.meshLayers!.every((layer, i) => {
        const otherLayer = b.meshLayers![i];
        if (!otherLayer) return false;
        return (
          layer.color === otherLayer.color &&
          layer.position.x === otherLayer.position.x &&
          layer.position.y === otherLayer.position.y
        );
      });
    }

    // For non-mesh gradients, also check stop count to differentiate aurora (4 stops) from linear (2 stops)
    // Compare stops by colors and positions - ignore angle since it's user-adjustable
    return a.stops.every((stop, i) => {
      const otherStop = b.stops[i];
      if (!otherStop) return false;
      const colorMatch = stop.color === otherStop.color;
      const positionMatch =
        stop.position === otherStop.position ||
        Math.abs((stop.position ?? 0) - (otherStop.position ?? 0)) < 0.1;
      return colorMatch && positionMatch;
    });
  }

  // Different types are not equal
  return false;
}

function rgbCssToHex(input: string): string | null {
  const match = input.match(/rgb\\(\\s*(\\d+)\\s*[ ,]\\s*(\\d+)\\s*[ ,]\\s*(\\d+)\\s*\\)/i);
  if (!match) return null;

  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);

  if (![r, g, b].every((value) => Number.isFinite(value) && value >= 0 && value <= 255)) {
    return null;
  }

  const hex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function getTextColorFromGradient(gradient: CustomGradient): ColorToken {
  const palette: string[] = [];
  if (isAdvancedGradient(gradient)) {
    gradient.stops.forEach((stop) => {
      if (stop?.color) {
        palette.push(stop.color);
      }
    });
  } else if (isLegacyGradient(gradient)) {
    palette.push(gradient.from, gradient.to);
  }
  if (palette.length === 0) {
    palette.push("#000000");
  }
  return getContrastTextColor(palette);
}
