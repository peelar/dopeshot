"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/utils";
import { Download, ImageUp, Loader2, RefreshCw } from "lucide-react";

interface AppHeaderProps {
  hasCustomScreenshot: boolean;
  isProcessingUpload: boolean;
  onUploadClick: () => void;
  hasScreenshot: boolean;
  onExport: () => void;
  isExporting: boolean;
}

export function AppHeader({
  hasCustomScreenshot,
  isProcessingUpload,
  onUploadClick,
  hasScreenshot,
  onExport,
  isExporting,
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a href="/" aria-label="Go to homepage" className="flex items-center gap-2 pl-4 transition-opacity hover:opacity-80">
        <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-foreground text-background" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="4" transform="rotate(45 12 12)" />
          </svg>
        </div>
        <span className="font-bold text-sm tracking-tight">dopeshot</span>
      </a>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex items-center gap-2 border-border/80 bg-muted/40 text-foreground shadow-none hover:bg-muted/60 hover:text-foreground dark:border-border/50 dark:bg-muted/25 dark:text-foreground dark:hover:bg-muted/40"
          onClick={onUploadClick}
          disabled={isProcessingUpload}
          aria-label={hasCustomScreenshot ? "Change screenshot" : "Upload your screenshot"}
          aria-busy={isProcessingUpload}
        >
          <UploadIcon className={cn("h-4 w-4", isProcessingUpload && "animate-spin")} aria-hidden="true" />
          <span className="hidden sm:inline">{uploadButtonLabel}</span>
          <span className="sm:hidden">{uploadButtonShort}</span>
        </Button>
        {hasScreenshot ? (
          <Button
            size="sm"
            className="flex cursor-pointer items-center gap-2 bg-foreground text-background shadow-none hover:bg-foreground focus-visible:ring-foreground/40 disabled:cursor-not-allowed disabled:bg-foreground/70"
            onClick={onExport}
            disabled={isExporting}
            aria-busy={isExporting}
            aria-label={isExporting ? "Exporting image" : "Export as PNG"}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {isExporting ? "Exporting..." : "Export PNG"}
          </Button>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
