"use client";

import type { Asset } from "@/domain/asset/types";
import type { LayoutConfig } from "@/domain/layout/types";
import {
  LAYOUT_DEFINITIONS,
  getLayoutDefinition,
  normalizeLayoutId,
  supportsScreenshots,
  withLayoutTextDefaults,
} from "@/domain/layout-def/definitions";
import {
  assetsAtom,
  configAtom,
  orientationAtom,
  screenshotGradientAtom,
  screenshotZoomAtom,
} from "@/hooks/atoms";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";

// Memoize layout default configs at module level to avoid recreation
// Since layouts are now pre-flattened, each layout has exactly one variant baked in
const LAYOUT_DEFAULTS = LAYOUT_DEFINITIONS.map((layout) => {
  const defaultConfig = layout.createConfig();

  return {
    layout,
    defaultConfig,
    key: layout.id,
    displayName: layout.name,
  };
});

type PreviewCard = {
  key: string;
  displayName: string;
  layoutId: string;
  previewConfig: LayoutConfig;
};

export function LayoutSelector({ className }: { className?: string }) {
  const orientation = useAtomValue(orientationAtom);
  const currentConfig = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshotGradient = useAtomValue(screenshotGradientAtom);
  const setConfig = useSetAtom(configAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);

  // Memoize preview configs - only recalculate when user content changes
  // Preserve user's background, colors, and shadow settings across layout switches
  // BUT reset gradient when switching to non-screenshot layouts
  const previewConfigs = useMemo(() => {
    const currentLayoutSupportsScreenshots = supportsScreenshots(currentConfig.layoutId);
    const hasImageBackground = currentConfig.background?.type === "image";

    // Check if we have a stored screenshot gradient (persists across layout switches)
    const hasScreenshotGradient = screenshotGradient !== null;

    return LAYOUT_DEFAULTS.map(({ defaultConfig, key, displayName, layout }) => {
      const targetLayoutSupportsScreenshots = layout.capabilities.screenshot === "supported";

      // Determine background preservation strategy:
      // 1. If target look supports screenshots AND we have a screenshot gradient → use stored screenshot gradient
      // 2. If both looks have same screenshot support → preserve current background
      // 3. Otherwise → use default background
      let backgroundToUse;
      if (hasImageBackground) {
        // Always preserve user-selected image backgrounds across layouts
        backgroundToUse = currentConfig.background;
      } else if (targetLayoutSupportsScreenshots && hasScreenshotGradient) {
        // Always use stored screenshot gradient for screenshot-capable looks
        backgroundToUse = screenshotGradient;
      } else if (currentLayoutSupportsScreenshots === targetLayoutSupportsScreenshots) {
        // Preserve background when staying in same category (screenshot→screenshot or non-screenshot→non-screenshot)
        backgroundToUse = currentConfig.background;
      } else {
        // Reset to default when switching categories without a screenshot gradient
        backgroundToUse = defaultConfig.background;
      }

      const previewConfig = withLayoutTextDefaults(
        {
          ...defaultConfig,
          // variant is already baked into defaultConfig by expandLayoutVariants
          text: currentConfig.text,
          assets: currentConfig.assets,
          background: backgroundToUse,
          colors: currentConfig.colors,
          screenshotShadow: currentConfig.screenshotShadow,
          fontStyle: currentConfig.fontStyle,
          screenshotFrame: currentConfig.screenshotFrame,
        } as typeof currentConfig,
        { preserveEmptyText: true },
      );

      return {
        key,
        displayName,
        layoutId: layout.id,
        previewConfig,
      };
    });
  }, [
    currentConfig.assets,
    currentConfig.background,
    currentConfig.colors,
    currentConfig.fontStyle,
    currentConfig.layoutId,
    currentConfig.screenshotShadow,
    currentConfig.screenshotFrame,
    currentConfig.text,
    screenshotGradient,
  ]);

  const previewConfigByLayoutId = useMemo(() => {
    const map = new Map<string, LayoutConfig>();
    for (const option of previewConfigs) {
      map.set(option.layoutId, option.previewConfig);
    }
    return map;
  }, [previewConfigs]);

  const filteredPreviewConfigs = useMemo(() => {
    let options = previewConfigs;

    // Filter by screenshot support
    options = options.filter((option) => supportsScreenshots(option.layoutId));

    // Filter by orientation
    options = options.filter((option) => {
      const def = getLayoutDefinition(option.layoutId);
      const supportedOrientations = def?.capabilities.supportedOrientations ?? [
        "mobile",
        "desktop",
      ];
      return supportedOrientations.includes(orientation);
    });

    return options;
  }, [orientation, previewConfigs]);

  const applyLayoutSelection = useCallback(
    (layoutId: string, displayName?: string) => {
      const nextConfig = previewConfigByLayoutId.get(layoutId);
      if (!nextConfig) return;

      if (displayName) {
        track("look_changed", {
          from_look: currentConfig.layoutId,
          to_look: layoutId,
          look_name: displayName,
        });
      }

      setConfig(
        withLayoutTextDefaults(
          {
            ...nextConfig,
            // variant is already in nextConfig from the flattened layout definition
          },
          { preserveEmptyText: true },
        ),
      );
      setScreenshotZoom(1.0);
    },
    [currentConfig.layoutId, previewConfigByLayoutId, setConfig, setScreenshotZoom],
  );


  return (
    <div className={cn("flex w-full flex-col gap-2 sm:px-4", className)}>
      <div className="flex w-full gap-3 overflow-x-auto px-1 py-2 sm:gap-4 sm:py-3">
        {filteredPreviewConfigs.map(({ key, displayName, layoutId, previewConfig }) => {
          // Normalize current config's layoutId before comparison to handle legacy IDs
          const normalizedCurrentLayoutId = normalizeLayoutId(currentConfig.layoutId);
          const isSelected = normalizedCurrentLayoutId === layoutId;

          const handleSelect = () => {
            applyLayoutSelection(layoutId, displayName);
          };

          return (
            <LayoutPreviewCard
              key={key}
              option={{ key, displayName, layoutId, previewConfig }}
              assets={assets}
              isSelected={isSelected}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

function LayoutSketch({
  layoutId,
  orientation,
}: {
  layoutId: string;
  orientation: "mobile" | "desktop";
}) {
  const isMobile = orientation === "mobile";

  // Extract variant from layout ID (e.g., "popup-gradient-left" -> "left")
  const variant = layoutId.includes("-")
    ? (layoutId.split("-").pop() as "left" | "right" | "center" | undefined)
    : undefined;

  const isPeakLayout = layoutId.startsWith("popup-gradient");
  const isSpotlightLayout = layoutId.startsWith("hero-center");
  const isBackdropLayout = layoutId.startsWith("adaptive-stage");

  if (isPeakLayout && variant) {
    // Peak layouts: text on one side, screenshot on the other or center
    if (variant === "center") {
      // Center variant: text at top, screenshot below
      return (
        <div className="flex h-full w-full flex-col bg-stone-100 p-2 dark:bg-stone-800">
          {/* Text area at top */}
          <div className="mb-1.5 flex h-4 w-full items-center justify-center">
            <div className="h-2 w-16 rounded bg-stone-400 dark:bg-stone-500" />
          </div>
          {/* Screenshot area */}
          <div className="flex-1 rounded bg-stone-300 dark:bg-stone-700" />
        </div>
      );
    } else {
      // Left/Right variants: text on one side, screenshot on the other
      // Note: variant "left" = image peaks from right, variant "right" = image peaks from left
      // On mobile, these variants don't show text (but keep the column structure)
      const isLeft = variant === "left";
      const showText = !isMobile;
      return (
        <div className="flex h-full w-full bg-stone-100 p-2 dark:bg-stone-800">
          {isLeft && (
            <div className="mr-1 flex w-1/3 flex-col justify-center">
              {showText && (
                <>
                  <div className="mb-1 h-2 w-full rounded bg-stone-400 dark:bg-stone-500" />
                  <div className="h-1.5 w-3/4 rounded bg-stone-400/70 dark:bg-stone-500/70" />
                </>
              )}
            </div>
          )}
          <div className={cn("flex-1 rounded bg-stone-300 dark:bg-stone-700", !isLeft && "ml-1")} />
          {!isLeft && (
            <div className="ml-1 flex w-1/3 flex-col items-end justify-center">
              {showText && (
                <>
                  <div className="mb-1 h-2 w-full rounded bg-stone-400 dark:bg-stone-500" />
                  <div className="h-1.5 w-3/4 rounded bg-stone-400/70 dark:bg-stone-500/70" />
                </>
              )}
            </div>
          )}
        </div>
      );
    }
  }

  if (isSpotlightLayout) {
    // Spotlight: centered screenshot with text overlay or above
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-stone-100 p-2 dark:bg-stone-800">
        <div className="mb-1.5 flex h-3 w-full items-center justify-center">
          <div className="h-2 w-20 rounded bg-stone-400 dark:bg-stone-500" />
        </div>
        <div className="h-3/4 w-4/5 rounded bg-stone-300 dark:bg-stone-700" />
      </div>
    );
  }

  if (isBackdropLayout) {
    // Backdrop: screenshot fills background, text overlay
    return (
      <div className="relative h-full w-full bg-stone-200 p-2 dark:bg-stone-800">
        <div className="h-full w-full rounded bg-stone-300/80 dark:bg-stone-700/80" />
        <div className="absolute inset-2 flex items-center justify-center">
          <div className="h-2.5 w-24 rounded bg-stone-500/30 dark:bg-stone-400/30" />
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="flex h-full w-full items-center justify-center bg-stone-100 dark:bg-stone-800">
      <div className="h-3/4 w-4/5 rounded bg-stone-300/70 dark:bg-stone-700/70" />
    </div>
  );
}

function LayoutPreviewCard({
  option,
  assets,
  isSelected,
  onSelect,
}: {
  option: PreviewCard;
  assets: Asset[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const orientation = useAtomValue(orientationAtom);

  return (
    <Button
      type="button"
      onClick={onSelect}
      variant="ghost"
      className={cn(
        "group relative flex h-auto flex-col gap-1 rounded-lg border border-transparent p-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:gap-2 sm:p-2",
        isSelected
          ? "border-primary/30 ring-1 ring-primary/15 ring-offset-1 ring-offset-background"
          : "hover:border-border/40 hover:bg-muted/20",
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${option.displayName} look`}
    >
      <div className="relative h-[64px] w-[105px] overflow-hidden rounded bg-background ring-1 ring-border/5 sm:h-[90px] sm:w-[144px]">
        <LayoutSketch layoutId={option.layoutId} orientation={orientation} />
      </div>
      <div className="flex items-center justify-between gap-2 px-1">
        <span
          className={cn(
            "text-xs font-medium transition-colors",
            isSelected ? "text-primary/80" : "text-muted-foreground group-hover:text-foreground",
          )}
        >
          {option.displayName}
        </span>
      </div>
    </Button>
  );
}
