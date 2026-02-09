"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { Download, ImageIcon, Loader2, Plus, RefreshCw, Save, PanelLeft, Video } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "./user-menu";
import type { PreviewMode } from "@/hooks/atoms";

interface AppHeaderProps {
  isLoggedIn: boolean;
  hasSelectedSavedDesign: boolean;
  hasCustomScreenshot: boolean;
  isTestimonialFormat: boolean;
  isProcessingUpload: boolean;
  onUploadClick: () => void;
  onNewClick: () => void;
  canExport: boolean;
  onExport: () => void;
  isExporting: boolean;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
  isAtSaveLimit: boolean;
  saveCount: number;
  saveLimit: number;
  onFeedbackClick?: () => void;
  onLeftSidebarToggle?: () => void;
  leftSidebarOpen?: boolean;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  showVideoToggle: boolean;
}

export function AppHeader({
  isLoggedIn,
  hasSelectedSavedDesign,
  hasCustomScreenshot,
  isTestimonialFormat,
  isProcessingUpload,
  onUploadClick,
  onNewClick,
  canExport,
  onExport,
  isExporting,
  onSave,
  isSaving,
  canSave,
  isAtSaveLimit,
  saveCount,
  saveLimit,
  onFeedbackClick,
  onLeftSidebarToggle,
  leftSidebarOpen,
  previewMode,
  onPreviewModeChange,
  showVideoToggle,
}: AppHeaderProps) {
  const shouldShowNewButton = isLoggedIn && hasSelectedSavedDesign;
  const shouldShowCtaButton = !isLoggedIn || shouldShowNewButton || hasCustomScreenshot || isProcessingUpload;
  const hasSaveableContent = hasCustomScreenshot || isTestimonialFormat;
  const shouldShowSaveButton = hasSaveableContent && (canSave || isAtSaveLimit);
  const ctaVariant = shouldShowNewButton ? "outline" : "secondary";

  const ctaButtonLabel = shouldShowNewButton
    ? "New"
    : isProcessingUpload
      ? "Uploading..."
      : "Change Screenshot";

  const CtaIcon = shouldShowNewButton ? Plus : isProcessingUpload ? Loader2 : RefreshCw;

  return (
    <header className="relative sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-primary/30 after:via-primary/10 after:to-transparent after:opacity-40 sm:px-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Go to homepage" className="pl-4 transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        {onLeftSidebarToggle ? (
          <>
            <div className="relative h-6 w-px bg-border/60" aria-hidden="true" />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 rounded-md p-0 sm:hidden"
              onClick={onLeftSidebarToggle}
              aria-label="Toggle account sidebar"
              aria-pressed={leftSidebarOpen}
            >
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {shouldShowCtaButton ? (
          <Button
            type="button"
            size="sm"
            variant={ctaVariant}
            className={cn(
              "hidden items-center gap-2 shadow-none sm:inline-flex",
              shouldShowNewButton &&
                "border-border/80 bg-muted/40 text-foreground hover:bg-muted/60 hover:text-foreground dark:border-border/50 dark:bg-muted/25 dark:text-foreground dark:hover:bg-muted/40",
            )}
            onClick={shouldShowNewButton ? onNewClick : onUploadClick}
            disabled={isProcessingUpload}
            aria-label={
              shouldShowNewButton ? "New Design" : isProcessingUpload ? "Uploading Screenshot" : "Change Screenshot"
            }
            aria-busy={isProcessingUpload}
          >
            <CtaIcon
              className={cn(
                "h-4 w-4",
                !shouldShowNewButton && isProcessingUpload && "animate-spin",
              )}
              aria-hidden="true"
            />
            <span>{ctaButtonLabel}</span>
          </Button>
        ) : null}
        {/* Save button - independent of export */}
        {shouldShowSaveButton ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex items-center gap-2 shadow-none"
                    onClick={onSave}
                    disabled={isSaving || !canSave || isAtSaveLimit}
                    aria-busy={isSaving}
                    aria-label={isSaving ? "Saving Design" : "Save Design"}
                  />
                }
              >
                {isSaving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                )}
                Save
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isAtSaveLimit
                    ? `Delete a saved design to save this one (${saveCount}/${saveLimit})`
                    : canSave
                      ? "Save this design to access it later"
                      : "Sign in to save designs"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
        {/* Image/Video toggle + Export button */}
        {canExport ? (
          <div className="flex items-center gap-1.5">
            {showVideoToggle ? (
              <div className="flex gap-0.5 rounded-md border border-border/40 bg-muted/20 p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onPreviewModeChange("image")}
                  aria-pressed={previewMode === "image"}
                  aria-label="Image mode"
                  className={cn(
                    "h-7 w-7 rounded transition-colors",
                    previewMode === "image"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onPreviewModeChange("video")}
                  aria-pressed={previewMode === "video"}
                  aria-label="Video mode"
                  className={cn(
                    "h-7 w-7 rounded transition-colors",
                    previewMode === "video"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Video className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
            <Button
              size="sm"
              variant="default"
              className="flex items-center gap-2 shadow-none"
              onClick={onExport}
              disabled={isExporting}
              aria-busy={isExporting}
              aria-label={isExporting ? "Exporting" : "Export"}
            >
              {isExporting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              )}
              Export
            </Button>
          </div>
        ) : null}
        <UserMenu onFeedbackClick={onFeedbackClick} />
      </div>
    </header>
  );
}
