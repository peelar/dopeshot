"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Camera, MessageSquareQuote, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { activeFormatAtom } from "@/hooks/atoms";
import { canvasAtom, currentLayoutAtom } from "@/hooks/atoms/derived";
import { getLayoutComponent } from "@/components/layouts/registry";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { LayoutFormat } from "@/domain/layout-def/definitions";
import { useSession } from "@/lib/auth/auth-client";
import { useUserTier } from "@/hooks/use-user-tier";
import { track } from "@/lib/analytics";

function XLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label="X">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface CoverPreviewProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background" | "avatar") => void;
  isStatic?: boolean;
  showEmptyState?: boolean;
  showLoadingState?: boolean;
  onEmptyStateClick?: () => void;
  onFormatChosen?: (format: LayoutFormat) => void;
  onLockedTestimonialClick?: () => void;
}

export function CoverPreview({
  className,
  onUploadAsset,
  isStatic = false,
  showEmptyState = false,
  showLoadingState = false,
  onEmptyStateClick,
  onFormatChosen,
  onLockedTestimonialClick,
}: CoverPreviewProps) {
  const layout = useAtomValue(currentLayoutAtom);
  const canvasDimensions = useAtomValue(canvasAtom);
  const activeFormat = useAtomValue(activeFormatAtom);
  const setActiveFormat = useSetAtom(activeFormatAtom);
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const { isBrandUser } = useUserTier();
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
              <span className="text-lg font-semibold text-foreground/70 dark:text-foreground/95">
                What do you want to ship today?
              </span>
              <TooltipProvider>
                <div className="flex gap-4">
                <FormatCard
                  icon={<Camera className="h-6 w-6" strokeWidth={1.5} />}
                  label="Screenshot"
                  description="Polished product screenshots"
                  onClick={() => {
                    if (onFormatChosen) {
                      onFormatChosen("screenshot");
                      return;
                    }
                    setActiveFormat("screenshot");
                  }}
                />
                {isBrandUser ? (
                  <FormatCard
                    icon={<MessageSquareQuote className="h-6 w-6" strokeWidth={1.5} />}
                    label="Testimonial"
                    description="Social proof graphics from customer quotes"
                    onClick={() => {
                      setActiveFormat("testimonial");
                      onFormatChosen?.("testimonial");
                    }}
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger
                      render={(props) => (
                        <span {...props}>
                          <FormatCard
                            icon={<MessageSquareQuote className="h-6 w-6" strokeWidth={1.5} />}
                            label="Testimonial"
                            description="Social proof graphics from customer quotes"
                            isLocked
                            onClick={() => {
                              track("testimonial_gate_hit", {
                                reason: isLoggedIn ? "free_tier" : "not_logged_in",
                              });
                              onLockedTestimonialClick?.();
                            }}
                          />
                        </span>
                      )}
                    />
                    <TooltipContent side="top">Available on Brand plan.</TooltipContent>
                  </Tooltip>
                )}
                {isBrandUser ? (
                  <FormatCard
                    icon={<XLogo size={24} />}
                    label="Tweet"
                    description="Turn tweets into branded cards"
                    isNew
                    onClick={() => {
                      setActiveFormat("tweet");
                      onFormatChosen?.("tweet");
                    }}
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger
                      render={(props) => (
                        <span {...props}>
                          <FormatCard
                            icon={<XLogo size={24} />}
                            label="Tweet"
                            description="Turn tweets into branded cards"
                            isNew
                            isLocked
                            onClick={() => {
                              track("testimonial_gate_hit", {
                                reason: isLoggedIn ? "free_tier" : "not_logged_in",
                              });
                              onLockedTestimonialClick?.();
                            }}
                          />
                        </span>
                      )}
                    />
                    <TooltipContent side="top">Available on Brand plan.</TooltipContent>
                  </Tooltip>
                )}
                </div>
              </TooltipProvider>
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
  isLocked = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  isNew?: boolean;
  isLocked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={isLocked}
      className={cn(
        "group relative flex h-40 w-44 flex-col items-center gap-3 rounded-xl p-6",
        "backdrop-blur-sm transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isLocked
          ? "cursor-pointer border border-foreground/[0.05] bg-background/50 opacity-50"
          : "cursor-pointer border border-foreground/[0.12] bg-background/90 shadow-md hover:border-foreground/[0.2] hover:bg-background hover:shadow-xl hover:-translate-y-0.5",
      )}
    >
      {isNew && (
        <span className="absolute -right-2 -top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          New
        </span>
      )}
      {isLocked && (
        <span className="absolute right-2 top-2 text-foreground/50">
          <Lock className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="text-foreground/50 transition-colors group-hover:text-foreground/80 dark:text-foreground/80 dark:group-hover:text-foreground">
        {icon}
      </span>
      <span className="text-sm font-semibold text-foreground/70 transition-colors group-hover:text-foreground/90 dark:text-foreground/95 dark:group-hover:text-foreground">
        {label}
      </span>
      <span className="text-center text-xs leading-relaxed text-foreground/40 transition-colors group-hover:text-foreground/60 dark:text-foreground/65 dark:group-hover:text-foreground/75">
        {description}
      </span>
    </button>
  );
}
