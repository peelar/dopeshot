"use client";

import { useAtom } from "jotai";
import { VariantToggle } from "@/components/variant-toggle";
import { CoverPreview } from "@/components/cover-preview";
import { PreviewViewport } from "@/components/preview-viewport";
import { ScreenshotZoomSlider } from "@/components/screenshot-zoom-slider";
import { screenshotZoomAtom } from "@/hooks/atoms";
import { cn } from "@/utils";

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
  onVariantChange: (variant: string) => void;
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
  onVariantChange,
  shouldShowAspectLock,
  isAspectLocked,
  onToggleAspect,
  canvasHeight,
  canvasWidth,
  isAnalyzingColors,
  showFocusHint,
}: PlaygroundWorkspaceProps) {
  const [screenshotZoom, setScreenshotZoom] = useAtom(screenshotZoomAtom);

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-background px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <VariantToggle onVariantChange={onVariantChange} />

        {shouldShowAspectLock ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onToggleAspect}
              aria-pressed={isAspectLocked}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
                isAspectLocked
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              )}
            >
              {isAspectLocked ? "Locked · 16:9" : "Lock to 16:9"}
            </button>
          </div>
        ) : null}

        <div className="relative flex w-full justify-center">
          <PreviewViewport
            surfaceWidth={canvasWidth}
            surfaceHeight={canvasHeight}
            isLoading={isAnalyzingColors}
            loadingText="Analyzing colors..."
          >
            <CoverPreview />
          </PreviewViewport>
          {showFocusHint ? (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <span className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/80 shadow-sm ring-1 ring-border/70">
                Screenshot-focused variant active
              </span>
            </div>
          ) : null}
        </div>

        <ScreenshotZoomSlider value={screenshotZoom} onChange={setScreenshotZoom} />
      </div>
    </div>
  );
}
