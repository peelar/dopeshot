"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { Download, ImageUp, Loader2, Plus, RefreshCw, Save } from "lucide-react";
import { track } from "@/lib/analytics";
import { UserMenu } from "./user-menu";
import { MemorySidebarTrigger } from "@/components/memory/memory-sidebar-trigger";

interface AppHeaderProps {
  isLoggedIn: boolean;
  hasSelectedSavedDesign: boolean;
  hasCustomScreenshot: boolean;
  isProcessingUpload: boolean;
  onUploadClick: () => void;
  onNewClick: () => void;
  showUploadButton: boolean;
  canExport: boolean;
  onExport: () => void;
  isExporting: boolean;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
  isAtSaveLimit: boolean;
  saveCount: number;
  saveLimit: number;
  onBrandClick?: () => void;
  onFeedbackClick?: () => void;
}

export function AppHeader({
  isLoggedIn,
  hasSelectedSavedDesign,
  hasCustomScreenshot,
  isProcessingUpload,
  onUploadClick,
  onNewClick,
  showUploadButton,
  canExport,
  onExport,
  isExporting,
  onSave,
  isSaving,
  canSave,
  isAtSaveLimit,
  saveCount,
  saveLimit,
  onBrandClick,
  onFeedbackClick,
}: AppHeaderProps) {
  const shouldShowNewButton = isLoggedIn && hasSelectedSavedDesign;
  const shouldShowCtaButton = showUploadButton || shouldShowNewButton;

  const ctaButtonLabel = shouldShowNewButton
    ? "new"
    : isProcessingUpload
      ? "Uploading..."
      : hasCustomScreenshot
        ? "change screenshot"
        : "upload your screenshot";

  const CtaIcon = shouldShowNewButton ? Plus : isProcessingUpload ? Loader2 : hasCustomScreenshot ? RefreshCw : ImageUp;

  return (
    <header className="relative sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-primary/30 after:via-primary/10 after:to-transparent after:opacity-40 sm:px-6">
      <div className="flex items-center gap-3">
        <a href="/" aria-label="Go to homepage" className="pl-4 transition-opacity hover:opacity-80">
          <Logo />
        </a>
        <div className="relative h-6 w-px bg-border/60" aria-hidden="true" />
        <MemorySidebarTrigger />
      </div>
      <div className="flex items-center gap-3">
        {shouldShowCtaButton ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="hidden items-center gap-2 border-border/80 bg-muted/40 text-foreground shadow-none hover:bg-muted/60 hover:text-foreground dark:border-border/50 dark:bg-muted/25 dark:text-foreground dark:hover:bg-muted/40 sm:inline-flex"
            onClick={shouldShowNewButton ? onNewClick : onUploadClick}
            disabled={isProcessingUpload}
            aria-label={shouldShowNewButton ? "New design" : hasCustomScreenshot ? "change screenshot" : "upload your screenshot"}
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
        {onBrandClick ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onBrandClick();
              track("brand_panel_opened");
            }}
            className="text-foreground hover:bg-muted hover:text-foreground"
          >
            <span className="hidden md:inline">Brand</span>
          </Button>
        ) : null}
        {/* Save button - independent of export */}
        {canSave || isAtSaveLimit ? (
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
                    aria-label={isSaving ? "Saving design" : "Save design"}
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
        {/* Export button - independent of save */}
        {canExport ? (
          <Button
            size="sm"
            variant="default"
            className="flex items-center gap-2 shadow-none"
            onClick={onExport}
            disabled={isExporting}
            aria-busy={isExporting}
            aria-label={isExporting ? "Exporting image" : "Export as PNG"}
          >
            {isExporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            )}
            Export PNG
          </Button>
        ) : null}
        <UserMenu onFeedbackClick={onFeedbackClick} />
      </div>
    </header>
  );
}
