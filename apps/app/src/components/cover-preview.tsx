"use client";

import { useAtomValue } from "jotai";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { canvasAtom, currentLayoutAtom } from "@/hooks/atoms/derived";
import { getLayoutComponent } from "@/components/layouts/registry";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

interface CoverPreviewProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  isStatic?: boolean;
  showEmptyState?: boolean;
  showLoadingState?: boolean;
  onEmptyStateClick?: () => void;
}

export function CoverPreview({
  className,
  onUploadAsset,
  isStatic = false,
  showEmptyState = false,
  showLoadingState = false,
  onEmptyStateClick,
}: CoverPreviewProps) {
  const layout = useAtomValue(currentLayoutAtom);
  const canvasDimensions = useAtomValue(canvasAtom);

  if (!layout) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white",
          isStatic ? "" : "rounded-lg",
          className,
        )}
        style={{ aspectRatio: "1280 / 720" }}
      >
        <span className="text-sm text-slate-500">Look not found</span>
      </div>
    );
  }

  // getLayoutComponent throws an error if component is not found
  // This ensures we catch missing component registrations immediately
  const LayoutComponent = getLayoutComponent(layout.id);

  return (
    <div
      className={cn("relative w-full overflow-hidden", isStatic ? "" : "rounded-lg", className)}
      style={{
        aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`,
      }}
    >
      <LayoutComponent onUploadAsset={onUploadAsset} isStatic={isStatic} />
      {showLoadingState && !isStatic ? <LoadingOverlay className="z-30 rounded-lg" /> : null}
      {showEmptyState && !showLoadingState && !isStatic ? (
        <button
          type="button"
          onClick={onEmptyStateClick}
          className={cn(
            "group absolute inset-0 z-20 flex items-center justify-center rounded-lg",
            "text-foreground/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.08), rgba(255,255,255,0) 65%)",
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-8 rounded-2xl border border-dashed border-foreground/25 bg-white/0 transition group-hover:border-foreground/45"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-8 rounded-2xl bg-slate-950/16"
          />
          <span
            className="relative z-10 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/65 transition group-hover:text-foreground/95 group-hover:drop-shadow-[0_0_18px_rgba(255,255,255,0.55)]"
          >
            <Upload className="h-4 w-4 opacity-80 transition group-hover:opacity-100" aria-hidden="true" />
            <span className="border-b border-foreground/20 pb-0.5 transition group-hover:border-foreground/60">
              upload your screenshot
            </span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
