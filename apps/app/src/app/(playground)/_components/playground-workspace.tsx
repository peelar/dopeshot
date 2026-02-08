"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Monitor, Smartphone } from "lucide-react";
import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/app/(playground)/_components/preview-viewport";
import { AspectToggle } from "@/components/selectors/aspect-toggle";
import { ScreenshotZoomSlider } from "@/components/selectors/screenshot-zoom-slider";
import type { TestimonialExportAspect, TwitterExportAspect } from "@/domain/layout/types";
import {
  activeFormatAtom,
  screenshotZoomAtom,
  configAtom,
  orientationAtom,
  gradientOptionsAtom,
  isAnalyzingColorsAtom,
  type Orientation,
} from "@/hooks/atoms";
import {
  LAYOUT_DEFINITIONS,
  getLayoutDefinition,
  withLayoutTextDefaults,
} from "@/domain/layout-def/definitions";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useMobileDetection } from "@/hooks/use-mobile-detection";

/**
 * PlaygroundWorkspace
 *
 * Renders the main preview column containing:
 * - Variant toggle controls
 * - Aspect lock button (conditional)
 * - Preview viewport with cover
 *
 * Note: This is now only the preview column. The sidebar
 * is rendered at the page level in app/page.tsx
 */

interface PlaygroundWorkspaceProps {
  shouldShowAspectLock: boolean;
  isAspectLocked: boolean;
  onToggleAspect: () => void;
  showEmptyState: boolean;
  showLoadingState: boolean;
  onEmptyStateClick: () => void;
  onFormatChosen?: (format: import("@/domain/layout-def/definitions").LayoutFormat) => void;
  onLockedTestimonialClick?: () => void;
  canvasWidth: number;
  canvasHeight: number;
  showFocusHint: boolean;
  hasScreenshot: boolean;
}

export function PlaygroundWorkspace({
  shouldShowAspectLock,
  isAspectLocked,
  onToggleAspect,
  showEmptyState,
  showLoadingState,
  onEmptyStateClick,
  onFormatChosen,
  onLockedTestimonialClick,
  canvasHeight,
  canvasWidth,
  showFocusHint,
  hasScreenshot,
}: PlaygroundWorkspaceProps) {
  const [screenshotZoom, setScreenshotZoom] = useAtom(screenshotZoomAtom);
  const [orientation, setOrientation] = useAtom(orientationAtom);
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const activeFormat = useAtomValue(activeFormatAtom);
  const gradientOptions = useAtomValue(gradientOptionsAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);
  const [bottomWhitespace, setBottomWhitespace] = useState(0);
  const isMobile = useMobileDetection();
  const hasAutoSetOrientation = useRef(false);
  const showOrientationToggle = activeFormat === "screenshot";
  const showTestimonialAspectToggle = activeFormat === "testimonial";
  const showTwitterAspectToggle = activeFormat === "tweet";
  const testimonialExportAspect = config.layoutSpecificSettings?.testimonial?.exportAspect ?? "3:4";
  const twitterExportAspect = config.layoutSpecificSettings?.twitterTestimonial?.exportAspect ?? "4:5";

  const isBackdropLayout =
    config.layoutId === "adaptive-stage" || config.layoutId === "full-visual";
  const shouldHoldCanvas = hasScreenshot && (isAnalyzingColors || gradientOptions.length === 0);

  // Set mobile as default orientation on mobile devices
  useEffect(() => {
    // Only auto-set once, and only if we're on mobile with desktop orientation
    if (hasAutoSetOrientation.current) return;
    if (!isMobile) return;
    if (orientation !== "desktop") return;

    setOrientation("mobile");
    hasAutoSetOrientation.current = true;
  }, [isMobile, orientation, setOrientation]);

  const handleViewportMetricsChange = useCallback((metrics: { bottomWhitespace: number }) => {
    const nextValue = Math.round(metrics.bottomWhitespace);
    setBottomWhitespace((previousValue) =>
      previousValue === nextValue ? previousValue : nextValue,
    );
  }, []);

  const handleOrientationChange = (newOrientation: Orientation) => {
    // Check if current layout supports new orientation
    const currentDef = getLayoutDefinition(config.layoutId);
    const supportedOrientations = currentDef?.capabilities.supportedOrientations ?? [
      "mobile",
      "desktop",
    ];

    if (!supportedOrientations.includes(newOrientation)) {
      // Find first compatible layout
      const compatibleLayout = LAYOUT_DEFINITIONS.find((def) => {
        const orientations = def.capabilities.supportedOrientations ?? ["mobile", "desktop"];
        return orientations.includes(newOrientation);
      });

      if (compatibleLayout) {
        const nextConfig = compatibleLayout.createConfig();
        setConfig(
          withLayoutTextDefaults(
            {
              ...nextConfig,
              text: config.text,
              assets: config.assets,
              background: config.background,
              colors: config.colors,
              screenshotShadow: config.screenshotShadow,
              fontId: config.fontId,
              fontSize: config.fontSize,
              screenshotFrame: config.screenshotFrame,
              layoutSpecificSettings: {
                ...nextConfig.layoutSpecificSettings,
                ...config.layoutSpecificSettings,
              },
            },
            { preserveEmptyText: true },
          ),
        );
      }
    }

    setOrientation(newOrientation);
  };

  const handleTestimonialAspectChange = useCallback((nextAspect: TestimonialExportAspect) => {
    setConfig((prev) => ({
      ...prev,
      layoutSpecificSettings: {
        ...prev.layoutSpecificSettings,
        testimonial: {
          ...prev.layoutSpecificSettings?.testimonial,
          exportAspect: nextAspect,
        },
      },
    }));
  }, [setConfig]);

  const handleTwitterAspectChange = useCallback((nextAspect: TwitterExportAspect) => {
    setConfig((prev) => ({
      ...prev,
      layoutSpecificSettings: {
        ...prev.layoutSpecificSettings,
        twitterTestimonial: {
          ...prev.layoutSpecificSettings?.twitterTestimonial,
          exportAspect: nextAspect,
        },
      },
    }));
  }, [setConfig]);

  const screenshotAspectOptions = isMobile
    ? [
      {
        id: "mobile",
        label: <Smartphone className="h-3.5 w-3.5" />,
        ariaLabel: "Mobile mode (9:16)",
        iconOnly: true,
      },
      {
        id: "desktop",
        label: <Monitor className="h-3.5 w-3.5" />,
        ariaLabel: "Desktop mode (16:9)",
        iconOnly: true,
      },
    ]
    : [
      {
        id: "desktop",
        label: <Monitor className="h-3.5 w-3.5" />,
        ariaLabel: "Desktop mode (16:9)",
        iconOnly: true,
      },
      {
        id: "mobile",
        label: <Smartphone className="h-3.5 w-3.5" />,
        ariaLabel: "Mobile mode (9:16)",
        iconOnly: true,
      },
    ];

  const testimonialAspectOptions = [
    { id: "3:4", label: "3:4", ariaLabel: "Testimonial export ratio 3 by 4" },
    { id: "4:5", label: "4:5", ariaLabel: "Testimonial export ratio 4 by 5" },
    { id: "9:16", label: "9:16", ariaLabel: "Testimonial export ratio 9 by 16" },
    { id: "16:9", label: "16:9", ariaLabel: "Testimonial export ratio 16 by 9" },
  ];

  const twitterAspectOptions = [
    { id: "4:5", label: "4:5", ariaLabel: "Tweet export ratio 4 by 5" },
    { id: "16:9", label: "16:9", ariaLabel: "Tweet export ratio 16 by 9" },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="mx-auto flex h-full w-full max-w-full flex-col gap-6 px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
        <div className="relative z-10 flex shrink-0 items-center justify-center">
          {/* Orientation toggle — only visible for screenshot format */}
          {showOrientationToggle ? (
            <AspectToggle
              value={orientation}
              options={screenshotAspectOptions}
              onChange={(value) => handleOrientationChange(value as Orientation)}
            />
          ) : null}
          {showTestimonialAspectToggle ? (
            <AspectToggle
              value={testimonialExportAspect}
              options={testimonialAspectOptions}
              onChange={(value) => handleTestimonialAspectChange(value as TestimonialExportAspect)}
            />
          ) : null}
          {showTwitterAspectToggle ? (
            <AspectToggle
              value={twitterExportAspect}
              options={twitterAspectOptions}
              onChange={(value) => handleTwitterAspectChange(value as TwitterExportAspect)}
            />
          ) : null}

          {/* Aspect lock positioned absolutely on the right */}
          {shouldShowAspectLock ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleAspect}
              aria-pressed={isAspectLocked}
              className={cn(
                "absolute right-0 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
                isAspectLocked
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              )}
            >
              {isAspectLocked
                ? `Locked · ${orientation === "mobile" ? "Mobile" : "16:9"}`
                : `Lock to ${orientation === "mobile" ? "Mobile" : "16:9"}`}
            </Button>
          ) : null}
        </div>

        <div className="relative flex min-h-0 flex-1 w-full justify-center items-center">
          <PreviewViewport
            className={orientation === "mobile" ? "max-h-[85%]" : undefined}
            surfaceWidth={canvasWidth}
            surfaceHeight={canvasHeight}
            onViewportMetricsChange={handleViewportMetricsChange}
          >
            <div
              className={cn(
                "transition-opacity duration-300",
                shouldHoldCanvas ? "opacity-0 pointer-events-none" : "opacity-100",
              )}
            >
              <CoverPreview
                showEmptyState={showEmptyState}
                showLoadingState={showLoadingState}
                onEmptyStateClick={onEmptyStateClick}
                onFormatChosen={onFormatChosen}
                onLockedTestimonialClick={onLockedTestimonialClick}
              />
            </div>
          </PreviewViewport>
          {showFocusHint ? (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/80 shadow-sm ring-1 ring-border/70">
                Screenshot-focused variant active
              </span>
            </div>
          ) : null}
        </div>

        {hasScreenshot && !shouldHoldCanvas ? (
          <div className="relative z-10">
            <div
              style={
                bottomWhitespace ? { transform: `translateY(-${bottomWhitespace}px)` } : undefined
              }
            >
              <ScreenshotZoomSlider
                value={screenshotZoom}
                onChange={setScreenshotZoom}
                max={isBackdropLayout ? 1 : 1.5}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
