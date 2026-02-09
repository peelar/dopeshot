"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { ImageIcon, Sparkles, Video } from "lucide-react";
import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/app/(playground)/_components/preview-viewport";
import { AspectToggle } from "@/components/selectors/aspect-toggle";
import { VideoPreview } from "@/app/(playground)/_components/video-preview";
import { ScreenshotZoomSlider } from "@/components/selectors/screenshot-zoom-slider";
import {
  activeFormatAtom,
  screenshotZoomAtom,
  configAtom,
  orientationAtom,
  gradientOptionsAtom,
  hasCustomScreenshotAtom,
  isAnalyzingColorsAtom,
  previewModeAtom,
  type PreviewMode,
} from "@/hooks/atoms";
import { supportsVideo } from "@/domain/layout-def/definitions";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { useUserTier } from "@/hooks/use-user-tier";
import { track } from "@/lib/analytics";

/**
 * PlaygroundWorkspace
 *
 * Renders the main preview column containing:
 * - Video mode toggle (Image / Video)
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
  const orientation = useAtomValue(orientationAtom);
  const [previewMode, setPreviewMode] = useAtom(previewModeAtom);
  const config = useAtomValue(configAtom);
  const activeFormat = useAtomValue(activeFormatAtom);
  const gradientOptions = useAtomValue(gradientOptionsAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);
  const hasCustomScreenshot = useAtomValue(hasCustomScreenshotAtom);
  const [bottomWhitespace, setBottomWhitespace] = useState(0);
  const isMobile = useMobileDetection();
  const { isBrandUser } = useUserTier();
  const showFullScreenEmptyState = isMobile && showEmptyState && activeFormat === "none";

  const isBackdropLayout =
    config.layoutId === "adaptive-stage" || config.layoutId === "full-visual";
  const shouldHoldCanvas = hasScreenshot && (isAnalyzingColors || gradientOptions.length === 0);

  // Video toggle visibility — only for screenshot format in desktop orientation
  const isScreenshotFormat = activeFormat === "screenshot";
  const layoutSupportsVideo = supportsVideo(config.layoutId);
  const isDesktopOrientation = orientation !== "mobile";
  const showVideoToggle = isScreenshotFormat && hasCustomScreenshot && isDesktopOrientation;
  const canUseVideo = layoutSupportsVideo && isBrandUser;

  // Auto-reset to image mode when video isn't available
  useEffect(() => {
    if (previewMode === "video" && (!supportsVideo(config.layoutId) || orientation === "mobile")) {
      setPreviewMode("image");
      track("preview_mode_auto_reset", {
        layout_id: config.layoutId,
        reason: orientation === "mobile" ? "mobile_orientation" : "unsupported_layout",
      });
    }
  }, [config.layoutId, orientation, previewMode, setPreviewMode]);

  const handleViewportMetricsChange = useCallback((metrics: { bottomWhitespace: number }) => {
    const nextValue = Math.round(metrics.bottomWhitespace);
    setBottomWhitespace((previousValue) =>
      previousValue === nextValue ? previousValue : nextValue,
    );
  }, []);

  const handlePreviewModeChange = useCallback(
    (mode: PreviewMode) => {
      setPreviewMode(mode);
      track("preview_mode_changed", { mode });
    },
    [setPreviewMode],
  );

  const videoModeOptions = [
    {
      id: "image" as const,
      label: (
        <span className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          Image
        </span>
      ),
      ariaLabel: "Image mode",
    },
    {
      id: "video" as const,
      label: (
        <span className="flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5" />
          Video
          <Sparkles className="h-3 w-3 text-amber-500" />
        </span>
      ),
      ariaLabel: "Video mode",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div
        className={cn(
          "mx-auto flex h-full w-full max-w-full flex-col gap-6 px-2 pb-8 pt-4 sm:px-4 sm:pt-6",
          showFullScreenEmptyState && "gap-0 px-0 pb-0 pt-0 sm:px-0 sm:pt-0",
        )}
      >
        <div className="relative z-10 flex shrink-0 items-center justify-center">
          {/* Video mode toggle — centered above canvas */}
          {showVideoToggle ? (
            canUseVideo ? (
              <AspectToggle
                value={previewMode}
                options={videoModeOptions}
                onChange={(value) => handlePreviewModeChange(value as PreviewMode)}
              />
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="flex gap-1 rounded-md border border-border/20 bg-muted/10 p-0.5 opacity-40">
                      {videoModeOptions.map((option) => (
                        <Button
                          key={option.id}
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                          aria-label={option.ariaLabel}
                          className={cn(
                            "h-7 min-w-11 rounded px-2 text-[11px] font-semibold",
                            option.id === "image"
                              ? "bg-foreground text-background shadow-sm"
                              : "text-muted-foreground",
                          )}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  }
                />
                <TooltipContent>
                  {!layoutSupportsVideo
                    ? "Video available with Peak layouts"
                    : "Video available on Brand plan"}
                </TooltipContent>
              </Tooltip>
            )
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

        <div
          className={cn(
            "relative flex w-full items-center justify-center",
            previewMode === "video" ? "min-h-0 flex-[0_1_auto]" : "min-h-0 flex-1",
          )}
        >
          {previewMode === "video" ? (
            <VideoPreview />
          ) : (
            <>
              <PreviewViewport
                className={cn(
                  showFullScreenEmptyState ? "h-full w-full" : undefined,
                  orientation === "mobile" && !showFullScreenEmptyState ? "max-h-[85%]" : undefined,
                )}
                surfaceWidth={canvasWidth}
                surfaceHeight={canvasHeight}
                onViewportMetricsChange={handleViewportMetricsChange}
                fluidLayout={showFullScreenEmptyState}
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
                    fullHeight={showFullScreenEmptyState}
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
            </>
          )}
        </div>

        {hasScreenshot && !shouldHoldCanvas ? (
          <div className={cn("relative z-10", previewMode === "video" && "invisible")}>
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
