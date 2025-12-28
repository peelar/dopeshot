"use client";

import { useCallback, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Monitor, Smartphone } from "lucide-react";
import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/app/(playground)/_components/preview-viewport";
import { ScreenshotZoomSlider } from "@/components/selectors/screenshot-zoom-slider";
import { BackgroundSection } from "@/components/sidebar/background-section";
import {
  screenshotZoomAtom,
  configAtom,
  orientationAtom,
  type Orientation,
} from "@/hooks/atoms";
import {
  LAYOUT_DEFINITIONS,
  getLayoutDefinition,
  withLayoutTextDefaults,
} from "@/domain/layout-def/definitions";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

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
  isMobile: boolean;
  shouldShowAspectLock: boolean;
  isAspectLocked: boolean;
  onToggleAspect: () => void;
  canvasWidth: number;
  canvasHeight: number;
  isAnalyzingColors: boolean;
  showFocusHint: boolean;
}

export function PlaygroundWorkspace({
  isMobile,
  shouldShowAspectLock,
  isAspectLocked,
  onToggleAspect,
  canvasHeight,
  canvasWidth,
  isAnalyzingColors,
  showFocusHint,
}: PlaygroundWorkspaceProps) {
  const [screenshotZoom, setScreenshotZoom] = useAtom(screenshotZoomAtom);
  const [orientation, setOrientation] = useAtom(orientationAtom);
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const [bottomWhitespace, setBottomWhitespace] = useState(0);

  const isBackdropLayout = config.layoutId === "adaptive-stage" || config.layoutId === "full-visual";

  const handleViewportMetricsChange = useCallback(
    (metrics: { bottomWhitespace: number }) => {
      const nextValue = Math.round(metrics.bottomWhitespace);
      setBottomWhitespace((previousValue) =>
        previousValue === nextValue ? previousValue : nextValue
      );
    },
    []
  );

  const handleOrientationChange = (newOrientation: Orientation) => {
    // Check if current layout supports new orientation
    const currentDef = getLayoutDefinition(config.layoutId);
    const supportedOrientations = currentDef?.capabilities.supportedOrientations ?? [
      "mobile",
      "desktop",
    ];

    const previousLayoutId = config.layoutId;
    let layoutChanged = false;
    let newLayoutId = previousLayoutId;

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
            },
            { preserveEmptyText: true }
          )
        );
        layoutChanged = compatibleLayout.id !== previousLayoutId;
        newLayoutId = compatibleLayout.id;
      }
    }

    setOrientation(newOrientation);
    track("orientation_changed", {
      orientation: newOrientation,
      previous_orientation: orientation,
      layout_changed: layoutChanged,
      previous_layout: previousLayoutId,
      new_layout: newLayoutId,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="mx-auto flex h-full w-full max-w-full flex-col gap-6 px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
        <div className="relative z-10 flex flex-shrink-0 items-center justify-center">
          {/* Tiny icon-only orientation toggle - centered against screenshot */}
          <div className="flex gap-1 rounded-md border border-border/40 bg-muted/20 p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleOrientationChange("desktop")}
                aria-pressed={orientation === "desktop"}
                aria-label="Desktop mode (16:9)"
                className={cn(
                  "h-7 w-7 rounded transition-colors",
                  orientation === "desktop"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleOrientationChange("mobile")}
                aria-pressed={orientation === "mobile"}
                aria-label="Mobile mode (9:16)"
                className={cn(
                  "h-7 w-7 rounded transition-colors",
                  orientation === "mobile"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
            </div>

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
              {isAspectLocked ? "Locked · 16:9" : "Lock to 16:9"}
            </Button>
          ) : null}
        </div>

        <div className="relative flex min-h-0 flex-1 w-full justify-center">
          <PreviewViewport
            surfaceWidth={canvasWidth}
            surfaceHeight={canvasHeight}
            isLoading={isAnalyzingColors}
            loadingText="Analyzing colors..."
            onViewportMetricsChange={handleViewportMetricsChange}
          >
            <CoverPreview />
          </PreviewViewport>
          {showFocusHint ? (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/80 shadow-sm ring-1 ring-border/70">
                Screenshot-focused variant active
              </span>
            </div>
          ) : null}
        </div>

        <div
          className="relative z-10"
          style={
            bottomWhitespace
              ? { transform: `translateY(-${bottomWhitespace}px)` }
              : undefined
          }
        >
          <ScreenshotZoomSlider value={screenshotZoom} onChange={setScreenshotZoom} max={isBackdropLayout ? 1 : 1.5} />
        </div>

        {/* Mobile-only background selector */}
        {isMobile && (
          <div className="relative z-10 -mt-2">
            <BackgroundSection variant="inline" />
          </div>
        )}
      </div>
    </div>
  );
}
