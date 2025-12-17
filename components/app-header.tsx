"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/utils";
import { Download, ImageUp, Loader2, RefreshCw } from "lucide-react";
import { track } from "@/lib/analytics";

interface AppHeaderProps {
  hasCustomScreenshot: boolean;
  isProcessingUpload: boolean;
  onUploadClick: () => void;
  showUploadButton: boolean;
  canExport: boolean;
  onExport: () => void;
  isExporting: boolean;
  onBrandClick?: () => void;
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <a href="/" aria-label="Go to homepage" className="pl-4 transition-opacity hover:opacity-80">
        <Logo />
      </a>
      <div className="flex items-center gap-3">
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
        {canExport ? (
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
        {process.env.NODE_ENV === "development" && <ThemeToggle />}
      </div>
    </header>
  );
}
