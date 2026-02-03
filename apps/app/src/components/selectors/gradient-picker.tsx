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
import {
  customGradientToCss,
  generateGradientOptions,
  getContrastTextColor,
} from "@/domain/layout/gradients";
import { cn } from "@/lib/utils/cn";
import { BackgroundSwatch } from "@/components/selectors/background-swatch";
import { configAtom, gradientOptionsAtom, isAnalyzingColorsAtom } from "@/hooks/atoms";
import { Skeleton } from "@/components/ui/skeleton";
import { createOrganicBlobsPreviewDataUrl } from "@/domain/layout/patterns/organic-blobs";

interface GradientPickerProps {
  onChangeAction: (background: BackgroundConfig, textColor: ColorToken) => void;
  variant?: "default" | "inline";
}

export function GradientPicker({ onChangeAction, variant = "default" }: GradientPickerProps) {
  const config = useAtomValue(configAtom);

  const background =
    config.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
  const hasScreenshot = Boolean(config.assets?.screenshot);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);

  const generatedGradients = useAtomValue(gradientOptionsAtom);
  const fallbackGradients = useMemo((): CustomGradient[] => generateGradientOptions(), []);
  const availableGradients = hasScreenshot
    ? generatedGradients
    : generatedGradients.length > 0
      ? generatedGradients
      : fallbackGradients;
  const hasGradients = availableGradients.length > 0;
  const displayGradients = useMemo(() => {
    // Inline variant (mobile): show first 4 gradients (3 linear + mesh), exclude ambient
    // Default variant (sidebar): show all 6 gradients
    return variant === "inline" ? availableGradients.slice(0, 4) : availableGradients.slice(0, 6);
  }, [availableGradients, variant]);

  const matchesStaticGradient = useMemo(() => {
    if (!background.customGradient || !hasGradients) return false;
    return availableGradients.some((gradient) =>
      areGradientsEqual(gradient, background.customGradient),
    );
  }, [availableGradients, background.customGradient, hasGradients]);

  const userSelectedRef = useRef(false);

  // Auto-apply first gradient when screenshot is uploaded and no gradient is set
  useEffect(() => {
    if (!hasScreenshot) return;
    if (background.type !== "gradient") return;
    if (!hasGradients || availableGradients.length === 0) return;
    if (matchesStaticGradient) return;
    if (background.patternId || background.patternMode === "manual") return;

    // Skip if user manually selected a gradient
    if (userSelectedRef.current) return;

    // Skip if a custom gradient is already set
    if (background.customGradient) return;

    const firstGradient = availableGradients[0];
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
    background.customGradient,
    availableGradients,
    hasScreenshot,
    hasGradients,
    matchesStaticGradient,
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

  if (hasScreenshot && (isAnalyzingColors || generatedGradients.length === 0)) {
    const gridClass = variant === "inline" ? "grid-cols-4" : "grid-cols-3";
    const items = variant === "inline" ? 4 : 6;
    return (
      <div className="space-y-3">
        <div className={cn("grid gap-3", gridClass)}>
          {Array.from({ length: items }).map((_, index) => (
            <Skeleton key={`gradient-skeleton-${index}`} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="space-y-3">
        <GradientSwatches
          gradients={displayGradients}
          activeGradient={background.customGradient}
          disabled={false}
          onSelect={handleScreenshotSelect}
          gridClass="grid-cols-4"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/60 bg-muted/30">
        <div className="space-y-3 px-3 pb-3 pt-3">
          <GradientSwatches
            gradients={displayGradients}
            activeGradient={background.customGradient}
            disabled={false}
            onSelect={handleScreenshotSelect}
            gridClass="grid-cols-3"
          />
        </div>
      </div>
    </div>
  );
}

interface GradientSwatchesProps {
  gradients: CustomGradient[];
  activeGradient?: CustomGradient;
  disabled: boolean;
  onSelect: (
    gradient: CustomGradient,
    options?: { patternId?: BackgroundConfig["patternId"]; patternVariant?: string },
  ) => void;
  gridClass?: string;
}

function GradientSwatches({
  gradients,
  activeGradient,
  disabled,
  onSelect,
  gridClass = "grid-cols-4",
}: GradientSwatchesProps) {
  return (
    <div className={cn("grid gap-3", gridClass)}>
      {gradients.map((gradient, index) => {
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
          gradientCss = `url("${overlayUrl}") center / cover no-repeat, ${customGradientToCss(
            gradient,
          )}`;

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
            ariaLabel="Gradient option"
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
    <BackgroundSwatch
      selected={selected}
      onClick={onClick}
      ariaLabel={ariaLabel}
      style={{ background: gradientCss }}
    >
      <span className="sr-only">Gradient swatch</span>
    </BackgroundSwatch>
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
