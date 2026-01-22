"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { useAtomValue } from "jotai";
import {
  BackgroundConfig,
  ColorToken,
  CustomGradient,
  isAdvancedGradient,
  isLegacyGradient,
} from "@/domain/layout/types";
import { customGradientToCss, generateGradientOptions, getContrastTextColor } from "@/domain/layout/gradients";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { configAtom, isAnalyzingColorsAtom } from "@/hooks/atoms";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";
import { createOrganicBlobsPreviewDataUrl } from "@/domain/layout/patterns/organic-blobs";

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

  const userSelectedRef = useRef(false);

  // Auto-apply first screenshot gradient when available
  useEffect(() => {
    if (!hasScreenshot) return;
    if (background.type !== "gradient") return;
    if (!hasScreenshotGradients || dynamicGradients.length === 0) return;
    if (matchesScreenshotGradient) return;
    if (background.patternId || background.patternMode === "manual") return;

    // Skip if user manually selected a gradient
    if (userSelectedRef.current) return;

    const firstGradient = dynamicGradients[0];
    if (!firstGradient) return;

    const textColor = getTextColorFromGradient(firstGradient);
    const grainEnabled = background.grainEnabled ?? true;
    onChangeAction(
      {
        type: "gradient",
        value: "custom",
        customGradient: firstGradient,
        grainEnabled,
      },
      textColor,
    );
  }, [
    background.grainEnabled,
    background.patternId,
    background.patternMode,
    background.type,
    dynamicGradients,
    hasScreenshot,
    hasScreenshotGradients,
    matchesScreenshotGradient,
    onChangeAction,
  ]);

  const handleScreenshotSelect = useCallback(
    (
      gradient: CustomGradient,
      options?: { patternId?: BackgroundConfig["patternId"]; patternVariant?: string },
    ) => {
      userSelectedRef.current = true;
      const textColor = getTextColorFromGradient(gradient);
      onChangeAction(
        {
          type: "gradient",
          value: "custom",
          customGradient: gradient,
          patternId: options?.patternId,
          patternMode: options?.patternId ? "manual" : undefined,
          patternVariant: options?.patternVariant,
        },
        textColor,
      );
    },
    [onChangeAction],
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
        </div>
      </div>
    </div>
  );
}

interface ScreenshotGradientsProps {
  gradients: CustomGradient[];
  activeGradient?: CustomGradient;
  disabled: boolean;
  onSelect: (
    gradient: CustomGradient,
    options?: { patternId?: BackgroundConfig["patternId"]; patternVariant?: string },
  ) => void;
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

            // Integrate blobs into the last two ambient gradients (indices 4 and 5)
            const isAmbientBlob = index >= 4;
            let gradientCss = customGradientToCss(gradient);
            let onClick = () => !disabled && onSelect(gradient);

            if (isAmbientBlob) {
              const [primary, secondary] = getTwoGradientColors(gradient);
              // Use "v1" for the first ambient blob and "v2" for the second to add variety
              const variantKey = index === 4 ? "v1" : "v2";
              const seed = `organic-blobs:${variantKey}:${primary}:${secondary}`;
              const overlayUrl = createOrganicBlobsPreviewDataUrl({ seed, primary, secondary });
              gradientCss = `url("${overlayUrl}") center / cover no-repeat, ${customGradientToCss(gradient)}`;

              onClick = () =>
                !disabled &&
                onSelect(gradient, { patternId: "organic-blobs", patternVariant: variantKey });
            }

            return (
              <GradientSwatch
                key={`gradient-${index}`}
                gradientCss={gradientCss}
                selected={isSelected}
                onClick={onClick}
                ariaLabel="Screenshot gradient"
              />
            );
          })}
    </div>
  );
}

interface GradientSwatchProps {
  gradientCss: string;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

function GradientSwatch({ gradientCss, selected, onClick, ariaLabel }: GradientSwatchProps) {
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
      style={{ background: gradientCss }}
    >
      <span className="sr-only">Gradient swatch</span>
    </Button>
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

function getTwoGradientColors(gradient: CustomGradient): [string, string] {
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
