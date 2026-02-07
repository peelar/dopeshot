"use client";

import type { Asset } from "@/domain/asset/types";
import type { LayoutConfig } from "@/domain/layout/types";
import { getRandomDemoPreset } from "@/domain/demo/presets";
import {
  LAYOUT_DEFINITIONS,
  getLayoutDefinition,
  getLayoutFormat,
  normalizeLayoutId,
  supportsScreenshots,
  withLayoutTextDefaults,
  type LayoutFormat,
} from "@/domain/layout-def/definitions";
import {
  activeFormatAtom,
  assetsAtom,
  configAtom,
  orientationAtom,
  screenshotGradientAtom,
  screenshotZoomAtom,
} from "@/hooks/atoms";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { track } from "@/lib/analytics";
import { useSession } from "@/lib/auth/auth-client";
import { useUserTier } from "@/hooks/use-user-tier";
import { useColorAnalysis } from "@/hooks/use-color-analysis";
import { Lock, Sparkles } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";

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

const FORMAT_TABS: { value: LayoutFormat; label: string }[] = [
  { value: "screenshot", label: "Screenshot" },
  { value: "testimonial", label: "Testimonial" },
];

export function LayoutSelector({ className }: { className?: string }) {
  const orientation = useAtomValue(orientationAtom);
  const currentConfig = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);
  const screenshotGradient = useAtomValue(screenshotGradientAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);
  const [activeFormat, setActiveFormat] = useAtom(activeFormatAtom);
  const isFormatUnselected = activeFormat === "none";
  const formatForPreview = isFormatUnselected ? "screenshot" : activeFormat;
  const { data: session } = useSession();
  const { isBrandUser } = useUserTier();
  const { processColorAnalysis } = useColorAnalysis();
  const isLoggedIn = !!session?.user;

  // Tooltip state for locked testimonial tab
  const [showLockedTooltip, setShowLockedTooltip] = useState(false);

  // Track initial layoutId to detect when a saved design is loaded
  const initialLayoutIdRef = useRef(currentConfig.layoutId);

  // Sync activeFormat when the current layout changes (e.g., loading a saved design)
  // Skip on initial mount when activeFormat is "none" and layout hasn't changed
  useEffect(() => {
    const currentFormat = getLayoutFormat(currentConfig.layoutId);
    if (activeFormat === "none") {
      // Only sync if the layout changed from initial (saved design loaded)
      if (currentConfig.layoutId === initialLayoutIdRef.current) return;
    }
    if (currentFormat !== activeFormat) {
      setActiveFormat(currentFormat);
    }
    // Only sync when layoutId changes, not when activeFormat changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConfig.layoutId, setActiveFormat]);

  // Memoize preview configs - only recalculate when user content changes
  // Preserve user's background, colors, and shadow settings across layout switches
  // BUT reset gradient when switching to non-screenshot layouts
  const previewConfigs = useMemo(() => {
    const currentLayoutSupportsScreenshots = supportsScreenshots(currentConfig.layoutId);
    const hasImageBackground = currentConfig.background?.type === "image";

    // Check if we have a stored screenshot gradient (persists across layout switches)
    const hasScreenshotGradient = screenshotGradient !== null;

    return LAYOUT_DEFAULTS.map(({ defaultConfig, key, displayName, layout }) => {
      const targetFormat = layout.format;
      const currentFormat = getLayoutFormat(currentConfig.layoutId);

      // Only carry state to layouts within the SAME format
      // Cross-format layouts always use their fresh defaults
      if (targetFormat !== currentFormat) {
        const previewConfig = withLayoutTextDefaults(defaultConfig, { preserveEmptyText: true });
        return { key, displayName, layoutId: layout.id, previewConfig };
      }

      const targetLayoutSupportsScreenshots = layout.capabilities.screenshot === "supported";

      // Determine background preservation strategy (same-format only):
      let backgroundToUse;
      if (hasImageBackground) {
        backgroundToUse = currentConfig.background;
      } else if (targetLayoutSupportsScreenshots && hasScreenshotGradient) {
        backgroundToUse = screenshotGradient;
      } else if (currentLayoutSupportsScreenshots === targetLayoutSupportsScreenshots) {
        backgroundToUse = currentConfig.background;
      } else {
        backgroundToUse = defaultConfig.background;
      }

      const previewConfig = withLayoutTextDefaults(
        {
          ...defaultConfig,
          text: currentConfig.text,
          assets: currentConfig.assets,
          background: backgroundToUse,
          colors: currentConfig.colors,
          screenshotShadow: currentConfig.screenshotShadow,
          fontStyle: currentConfig.fontStyle,
          screenshotFrame: currentConfig.screenshotFrame,
          layoutSpecificSettings: {
            ...defaultConfig.layoutSpecificSettings,
            ...currentConfig.layoutSpecificSettings,
          },
        } as typeof currentConfig,
        { preserveEmptyText: true },
      );

      return { key, displayName, layoutId: layout.id, previewConfig };
    });
  }, [
    currentConfig.assets,
    currentConfig.background,
    currentConfig.colors,
    currentConfig.fontStyle,
    currentConfig.layoutId,
    currentConfig.layoutSpecificSettings,
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

    // Filter by active format (use screenshot as sizing baseline before first selection)
    options = options.filter((option) => {
      const def = getLayoutDefinition(option.layoutId);
      return def?.format === formatForPreview;
    });

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
  }, [formatForPreview, orientation, previewConfigs]);

  const applyLayoutSelection = useCallback(
    (layoutId: string, displayName?: string) => {
      const nextConfig = previewConfigByLayoutId.get(layoutId);
      if (!nextConfig) return;

      const fromFormat = getLayoutFormat(currentConfig.layoutId);
      const toFormat = getLayoutFormat(layoutId);

      if (displayName) {
        track("look_changed", {
          from_look: currentConfig.layoutId,
          to_look: layoutId,
          look_name: displayName,
          format: toFormat,
        });
      }

      setConfig(
        withLayoutTextDefaults({ ...nextConfig }, { preserveEmptyText: true }),
      );
      setScreenshotZoom(1.0);
    },
    [currentConfig.layoutId, previewConfigByLayoutId, setConfig, setScreenshotZoom],
  );

  const handleFormatTabClick = useCallback(
    (format: LayoutFormat) => {
      if (format === "testimonial" && !isBrandUser) {
        setShowLockedTooltip(true);
        track("testimonial_gate_hit", { reason: isLoggedIn ? "free_tier" : "not_logged_in" });
        return;
      }

      if (format === activeFormat) return;

      const previousFormat = activeFormat;
      setActiveFormat(format);

      track("format_tab_switched", {
        from: previousFormat,
        to: format,
      });

      if (format === "screenshot") {
        const demoPreset = getRandomDemoPreset();
        setConfig(demoPreset.config);
        setAssets([demoPreset.asset]);
        setScreenshotZoom(1.0);
        void processColorAnalysis(demoPreset.asset.url, demoPreset.asset.id, null);
        return;
      }

      // Auto-select first layout of the new format with a FRESH config
      // State is intentionally not carried between formats
      const firstLayoutOfFormat = LAYOUT_DEFINITIONS.find((l) => l.format === format);
      if (firstLayoutOfFormat) {
        const freshConfig = withLayoutTextDefaults(firstLayoutOfFormat.createConfig());
        setConfig(freshConfig);
        setScreenshotZoom(1.0);
      }
    },
    [activeFormat, isBrandUser, isLoggedIn, processColorAnalysis, setActiveFormat, setAssets],
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 py-3 sm:px-4",
        isFormatUnselected && "invisible",
        className,
      )}
      aria-hidden={isFormatUnselected}
    >
      {/* Format tabs */}
      <div className="flex gap-1 px-1 sm:px-0">
        {FORMAT_TABS.map((tab) => {
          const isActive = activeFormat === tab.value;
          const isLocked = tab.value === "testimonial" && !isBrandUser;
          const tabButton = (
            <button
              type="button"
              onClick={() => handleFormatTabClick(tab.value)}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : isLocked
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
              aria-pressed={isActive}
              aria-label={isLocked ? `${tab.label} (Brand tier required)` : `Show ${tab.label} layouts`}
            >
              {isLocked && <Lock className="h-3 w-3" />}
              {tab.label}
              {tab.value === "testimonial" && (
                <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-amber-500" />
              )}
            </button>
          );

          if (isLocked) {
            return (
                <Tooltip key={tab.value} open={showLockedTooltip} onOpenChange={setShowLockedTooltip}>
                  <TooltipTrigger render={tabButton} />
                  <TooltipContent side="bottom" align="start">
                  Available on Brand plan.
                  </TooltipContent>
                </Tooltip>
              );
          }

          return (
            <div key={tab.value} className="relative">
              {tabButton}
            </div>
          );
        })}
      </div>

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
    ? (layoutId.split("-").pop() as string | undefined)
    : undefined;

  const isPeakLayout = layoutId.startsWith("popup-gradient");
  const isSpotlightLayout = layoutId.startsWith("hero-center");
  const isBackdropLayout = layoutId.startsWith("adaptive-stage");
  const isTestimonialLayout = layoutId.startsWith("testimonial");

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
    // Spotlight: side-by-side with text on one side and screenshot on the other
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

  if (isTestimonialLayout) {
    const isTwitter = layoutId === "testimonial-twitter";

    if (isTwitter) {
      // Twitter testimonial: X logo, quote lines, author with handle
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-stone-100 p-3 dark:bg-stone-800">
          {/* X logo */}
          <div className="h-2.5 w-2.5 rounded-sm bg-stone-500 dark:bg-stone-400" />
          {/* Quote lines */}
          <div className="h-1.5 w-20 rounded bg-stone-400 dark:bg-stone-500" />
          <div className="h-1.5 w-14 rounded bg-stone-400/70 dark:bg-stone-500/70" />
          {/* Author with avatar dot */}
          <div className="mt-1 flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-stone-400 dark:bg-stone-500" />
            <div className="h-1 w-8 rounded bg-stone-300 dark:bg-stone-600" />
          </div>
        </div>
      );
    }

    // Testimonial: stars, quote lines, author at bottom — all centered
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-stone-100 p-3 dark:bg-stone-800">
        {/* Stars */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-stone-400 dark:bg-stone-500" />
          ))}
        </div>
        {/* Quote lines */}
        <div className="h-1.5 w-20 rounded bg-stone-400 dark:bg-stone-500" />
        <div className="h-1.5 w-14 rounded bg-stone-400/70 dark:bg-stone-500/70" />
        {/* Author */}
        <div className="mt-1 h-1 w-10 rounded bg-stone-300 dark:bg-stone-600" />
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
