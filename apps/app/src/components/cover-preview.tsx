"use client";

import { useAtomValue } from "jotai";
import { Plus } from "lucide-react";
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
            "group absolute inset-0 z-20 flex items-center justify-center overflow-hidden",
            "rounded-lg border border-foreground/[0.08] bg-background",
            "transition-colors duration-300",
            "hover:border-foreground/[0.15]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {/* Animated corner blobs */}
          <span
            aria-hidden="true"
            className="animate-blob-1 pointer-events-none absolute -left-[15%] -top-[25%] h-[50%] w-[40%] rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 blur-3xl dark:from-violet-500/40 dark:to-fuchsia-500/25"
          />
          <span
            aria-hidden="true"
            className="animate-blob-2 pointer-events-none absolute -right-[15%] -top-[20%] h-[45%] w-[35%] rounded-full bg-gradient-to-bl from-blue-500/15 to-cyan-500/10 blur-3xl dark:from-blue-500/35 dark:to-cyan-500/20"
          />
          <span
            aria-hidden="true"
            className="animate-blob-3 pointer-events-none absolute -bottom-[25%] -left-[10%] h-[45%] w-[35%] rounded-full bg-gradient-to-tr from-emerald-500/15 to-teal-500/10 blur-3xl dark:from-emerald-500/35 dark:to-teal-500/20"
          />
          <span
            aria-hidden="true"
            className="animate-blob-4 pointer-events-none absolute -bottom-[20%] -right-[15%] h-[50%] w-[40%] rounded-full bg-gradient-to-tl from-orange-500/15 to-amber-500/10 blur-3xl dark:from-orange-500/35 dark:to-amber-500/20"
          />

          <span className="relative z-10 flex flex-col items-center justify-center gap-4">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                "border border-foreground/[0.1] bg-foreground/[0.03]",
                "transition-all duration-300",
                "group-hover:border-foreground/[0.18] group-hover:bg-foreground/[0.06]",
              )}
            >
              <Plus
                className="h-5 w-5 text-foreground/50 transition-colors duration-300 group-hover:text-foreground/70"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </span>
            <span className="text-sm font-medium text-foreground/50 transition-colors duration-300 group-hover:text-foreground/70">
              Drop an image to start
            </span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
