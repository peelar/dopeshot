"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils/cn";
import { Download, ImageUp, Loader2, RefreshCw, MessageSquare } from "lucide-react";
import { track } from "@/lib/analytics";
import { UserMenu } from "./user-menu";
import { MemorySidebarTrigger } from "@/components/memory/memory-sidebar-trigger";

interface AppHeaderProps {
  hasCustomScreenshot: boolean;
  isProcessingUpload: boolean;
  onUploadClick: () => void;
  showUploadButton: boolean;
  canExport: boolean;
  onExport: () => void;
  isExporting: boolean;
  onBrandClick?: () => void;
  onFeedbackClick?: () => void;
}

export function AppHeader({
  hasCustomScreenshot,
  isProcessingUpload,
  onUploadClick,
  showUploadButton,
  canExport,
  onExport,
  isExporting,
  onBrandClick,
  onFeedbackClick,
}: AppHeaderProps) {
  const uploadButtonLabel = isProcessingUpload
    ? "Uploading..."
    : hasCustomScreenshot
      ? "Change Screenshot"
      : "Upload Your Screenshot";
  const uploadButtonShort = isProcessingUpload
    ? "Working"
    : hasCustomScreenshot
      ? "Change"
      : "Upload";
  const UploadIcon = isProcessingUpload ? Loader2 : hasCustomScreenshot ? RefreshCw : ImageUp;

  return (
    <header className="relative sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-primary/30 after:via-primary/10 after:to-transparent after:opacity-40 sm:px-6">
      <div className="flex items-center gap-3">
        <MemorySidebarTrigger />
        <a href="/" aria-label="Go to homepage" className="transition-opacity hover:opacity-80">
          <Logo />
        </a>
      </div>
      <div className="flex items-center gap-3">
        {onFeedbackClick ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onFeedbackClick();
              track("feedback_button_clicked");
            }}
            className="text-muted-foreground hover:text-foreground gap-1.5"
            aria-label="Open feedback modal"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Feedback</span>
          </Button>
        ) : null}
        {showUploadButton ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="hidden items-center gap-2 border-border/80 bg-muted/40 text-foreground shadow-none hover:bg-muted/60 hover:text-foreground dark:border-border/50 dark:bg-muted/25 dark:text-foreground dark:hover:bg-muted/40 sm:inline-flex"
            onClick={onUploadClick}
            disabled={isProcessingUpload}
            aria-label={hasCustomScreenshot ? "Change screenshot" : "Upload your screenshot"}
            aria-busy={isProcessingUpload}
          >
            <UploadIcon className={cn("h-4 w-4", isProcessingUpload && "animate-spin")} aria-hidden="true" />
            <span>{uploadButtonLabel}</span>
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
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {isExporting ? "Exporting..." : "Export PNG"}
          </Button>
        ) : null}
        <UserMenu />
      </div>
    </header>
  );
}
