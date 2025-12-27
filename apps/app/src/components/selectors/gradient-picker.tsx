"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { track } from "@/lib/analytics";
import { BackgroundConfig, ColorToken } from "@/domain/layout/types";
import { customGradientToCss } from "@/domain/layout/gradients";
import { getColorSourceType } from "@/domain/layout/gradients/color-source";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { configAtom, screenshotGradientAtom } from "@/hooks/atoms";
import type { DynamicBackground } from "@/domain/backgrounds/dynamic";

interface GradientPickerProps {
  onChangeAction: (background: BackgroundConfig, textColor: ColorToken) => void;
  dynamicBackgrounds: DynamicBackground[];
  selectedBackgroundId?: string | null;
  isLoading?: boolean;
}

export function GradientPicker({
  onChangeAction,
  dynamicBackgrounds,
  selectedBackgroundId = null,
  isLoading = false,
}: GradientPickerProps) {
  const config = useAtomValue(configAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const background =
    config.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
  const hasScreenshot = Boolean(config.assets?.screenshot);

  const hasBackgrounds = dynamicBackgrounds.length > 0;

  // Split backgrounds into vibrant (top row) and subtle (bottom row)
  const vibrantBackgrounds = useMemo(
    () => dynamicBackgrounds.filter((bg) => bg.row === "vibrant"),
    [dynamicBackgrounds],
  );
  const subtleBackgrounds = useMemo(
    () => dynamicBackgrounds.filter((bg) => bg.row === "subtle"),
    [dynamicBackgrounds],
  );

  const hasAutoAppliedRef = useRef(false);

  // Auto-apply first background when dynamic backgrounds become available
  useEffect(() => {
    // Reset auto-apply flag when backgrounds change (new screenshot uploaded)
    hasAutoAppliedRef.current = false;
  }, [dynamicBackgrounds]);

  useEffect(() => {
    // Need screenshot and generated backgrounds
    if (!hasScreenshot || dynamicBackgrounds.length === 0) return;

    // Already applied for this set of backgrounds
    if (hasAutoAppliedRef.current) return;

    // Already has a valid selection from this set
    if (dynamicBackgrounds.some((bg) => bg.id === selectedBackgroundId)) {
      hasAutoAppliedRef.current = true;
      return;
    }

    // Skip if user uploaded a custom background image
    if (background.type === "image") return;

    // Skip if user manually selected a preset gradient
    if (background.type === "gradient" && background.gradientSource) {
      const sourceType = typeof background.gradientSource === "string"
        ? background.gradientSource
        : getColorSourceType(background.gradientSource);
      if (sourceType === "preset" || sourceType === "manual" || sourceType === "brand") {
        return;
      }
    }

    const firstBackground = dynamicBackgrounds[0];
    if (!firstBackground) return;

    hasAutoAppliedRef.current = true;

    const newBackground: BackgroundConfig = {
      type: "gradient",
      value: firstBackground.id,
      customGradient: firstBackground.gradient,
      gradientSource: "screenshot",
    };

    setScreenshotGradient(newBackground);
    onChangeAction(newBackground, firstBackground.textColor);
  }, [
    background.type,
    background.gradientSource,
    dynamicBackgrounds,
    hasScreenshot,
    selectedBackgroundId,
    onChangeAction,
    setScreenshotGradient,
  ]);

  const handleBackgroundSelect = useCallback(
    (bg: DynamicBackground) => {
      track("gradient_source_changed", {
        source: "screenshot",
        backgroundId: bg.id,
      });

      const newBackground: BackgroundConfig = {
        type: "gradient",
        value: bg.id,
        customGradient: bg.gradient,
        gradientSource: "screenshot",
      };

      // Store in screenshotGradientAtom for persistence across layout changes
      setScreenshotGradient(newBackground);

      onChangeAction(newBackground, bg.textColor);
    },
    [onChangeAction, setScreenshotGradient],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/60 bg-muted/30">
        <div className="space-y-3 px-3 pb-3 pt-3">
          <DynamicBackgroundGrid
            vibrantBackgrounds={vibrantBackgrounds}
            subtleBackgrounds={subtleBackgrounds}
            selectedId={selectedBackgroundId}
            disabled={!hasBackgrounds}
            onSelect={handleBackgroundSelect}
            isLoading={isLoading || (!hasBackgrounds && hasScreenshot)}
          />
        </div>
      </div>
    </div>
  );
}

interface DynamicBackgroundGridProps {
  vibrantBackgrounds: DynamicBackground[];
  subtleBackgrounds: DynamicBackground[];
  selectedId?: string | null;
  disabled: boolean;
  onSelect: (background: DynamicBackground) => void;
  isLoading?: boolean;
}

function DynamicBackgroundGrid({
  vibrantBackgrounds,
  subtleBackgrounds,
  selectedId,
  disabled,
  onSelect,
  isLoading,
}: DynamicBackgroundGridProps) {
  const hasBackgrounds = vibrantBackgrounds.length > 0 || subtleBackgrounds.length > 0;

  if (!hasBackgrounds && !isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-border/40 bg-background/50 px-3 py-6 text-center text-xs text-muted-foreground">
        Upload a screenshot to reveal curated gradients.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Vibrant row */}
      <div className="grid grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`skeleton-vibrant-${index}`} className="h-12 w-full rounded-lg" />
            ))
          : vibrantBackgrounds.map((bg) => (
              <GradientSwatch
                key={bg.id}
                gradientCss={customGradientToCss(bg.gradient)}
                selected={selectedId === bg.id}
                onClick={() => !disabled && onSelect(bg)}
                ariaLabel={bg.name}
              />
            ))}
      </div>

      {/* Subtle row */}
      <div className="grid grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`skeleton-subtle-${index}`} className="h-12 w-full rounded-lg" />
            ))
          : subtleBackgrounds.map((bg) => (
              <GradientSwatch
                key={bg.id}
                gradientCss={customGradientToCss(bg.gradient)}
                selected={selectedId === bg.id}
                onClick={() => !disabled && onSelect(bg)}
                ariaLabel={bg.name}
              />
            ))}
      </div>
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
        "group relative flex h-12 w-full items-center overflow-hidden rounded-lg p-0 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2",
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
