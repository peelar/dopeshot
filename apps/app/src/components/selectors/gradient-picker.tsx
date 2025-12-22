"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { useAtomValue } from "jotai";
import { track } from "@/lib/analytics";
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

interface GradientPickerProps {
  onChangeAction: (background: BackgroundConfig, textColor: ColorToken) => void;
}

export function GradientPicker({ onChangeAction }: GradientPickerProps) {
  const config = useAtomValue(configAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);
  const background =
    config.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
  const colorPalette = screenshotAsset?.colorPalette;
  const hasScreenshot = Boolean(config.assets?.screenshot);
  const isCodeSnippet = config.layoutId === "code-snippet";

  // Generate multi-stop gradients from screenshot colors
  // Code snippets should never use screenshot-derived gradients
  const dynamicGradients = useMemo((): CustomGradient[] => {
    if (!colorPalette || isCodeSnippet) return [];

    // Use landscape as default aspect for picker (actual gradient uses correct aspect from page.tsx)
    return generateGradientOptions(colorPalette, {
      aspectCategory: "landscape",
      variant: undefined,
    });
  }, [colorPalette, isCodeSnippet]);

  const hasScreenshotGradients = dynamicGradients.length > 0;

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
    dynamicGradients,
    hasScreenshot,
    hasScreenshotGradients,
    matchesScreenshotGradient,
    onChangeAction,
  ]);

  const handleScreenshotSelect = useCallback(
    (gradient: CustomGradient) => {
      track("gradient_source_changed", {
        source: "screenshot",
      });
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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-muted/30">
        <div className="space-y-3 px-3 pb-3 pt-3">
          <ScreenshotGradients
            gradients={dynamicGradients}
            activeGradient={background.customGradient}
            disabled={!hasScreenshotGradients}
            onSelect={handleScreenshotSelect}
            isLoading={isAnalyzingColors || (!hasScreenshotGradients && hasScreenshot)}
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
  onSelect: (gradient: CustomGradient) => void;
  isLoading?: boolean;
}

function ScreenshotGradients({
  gradients,
  activeGradient,
  disabled,
  onSelect,
  isLoading,
}: ScreenshotGradientsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`skeleton-${index}`} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!gradients.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/40 bg-background/50 px-3 py-6 text-center text-xs text-muted-foreground">
        Upload a screenshot to reveal curated gradients.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {gradients.map((gradient, index) => {
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
      size="sm"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group relative flex h-12 w-full items-center overflow-hidden rounded-xl p-0 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2",
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
