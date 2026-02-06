"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Camera, MessageSquareQuote, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { activeFormatAtom } from "@/hooks/atoms";
import { canvasAtom, currentLayoutAtom } from "@/hooks/atoms/derived";
import { getLayoutComponent } from "@/components/layouts/registry";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import type { LayoutFormat } from "@/domain/layout-def/definitions";

interface CoverPreviewProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background" | "avatar") => void;
  isStatic?: boolean;
  showEmptyState?: boolean;
  showLoadingState?: boolean;
  onEmptyStateClick?: () => void;
  onFormatChosen?: (format: LayoutFormat) => void;
}

export function CoverPreview({
  className,
  onUploadAsset,
  isStatic = false,
  showEmptyState = false,
  showLoadingState = false,
  onEmptyStateClick,
  onFormatChosen,
}: CoverPreviewProps) {
  const layout = useAtomValue(currentLayoutAtom);
  const canvasDimensions = useAtomValue(canvasAtom);
  const activeFormat = useAtomValue(activeFormatAtom);
  const setActiveFormat = useSetAtom(activeFormatAtom);
  const showFormatChooser = activeFormat === "none" && showEmptyState && !isStatic;

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
        <div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center overflow-hidden",
            "rounded-lg border border-foreground/[0.08] bg-background",
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

          {showFormatChooser ? (
            <div className="relative z-10 flex flex-col items-center gap-8">
              <span className="text-lg font-semibold text-foreground/70">
                What do you want to ship today?
              </span>
              <div className="flex gap-4">
                <FormatCard
                  icon={<Camera className="h-6 w-6" strokeWidth={1.5} />}
                  label="Screenshot"
                  description="Wrap a screenshot in a beautiful layout"
                  onClick={() => {
                    setActiveFormat("screenshot");
                    onFormatChosen?.("screenshot");
                  }}
                />
                <FormatCard
                  icon={<MessageSquareQuote className="h-6 w-6" strokeWidth={1.5} />}
                  label="Testimonial"
                  description="Create a social proof graphic"
                  isNew
                  onClick={() => {
                    setActiveFormat("testimonial");
                    onFormatChosen?.("testimonial");
                  }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onEmptyStateClick}
              className="group relative z-10 flex flex-col items-center justify-center gap-4"
            >
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
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FormatCard({
  icon,
  label,
  description,
  isNew,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  isNew?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-44 flex-col items-center gap-3 rounded-xl p-6",
        "border border-foreground/[0.08] bg-background/80 backdrop-blur-sm",
        "transition-all duration-200",
        "hover:border-foreground/[0.2] hover:bg-background/90 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {isNew && (
        <span className="absolute -right-2 -top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          New
        </span>
      )}
      <span className="text-foreground/50 transition-colors group-hover:text-foreground/80">
        {icon}
      </span>
      <span className="text-sm font-semibold text-foreground/70 transition-colors group-hover:text-foreground/90">
        {label}
      </span>
      <span className="text-center text-xs leading-relaxed text-foreground/40 transition-colors group-hover:text-foreground/60">
        {description}
      </span>
    </button>
  );
}
