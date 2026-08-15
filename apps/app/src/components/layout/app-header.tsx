"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils/cn";
import { Download, Loader2, RefreshCw, PanelLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

interface AppHeaderProps {
  hasCustomScreenshot: boolean;
  isProcessingUpload: boolean;
  onUploadClick: () => void;
  canExport: boolean;
  onExport: () => void;
  isExporting: boolean;
  onLeftSidebarToggle?: () => void;
  leftSidebarOpen?: boolean;
}

export function AppHeader({
  hasCustomScreenshot,
  isProcessingUpload,
  onUploadClick,
  canExport,
  onExport,
  isExporting,
  onLeftSidebarToggle,
  leftSidebarOpen,
}: AppHeaderProps) {
  const shouldShowCtaButton = hasCustomScreenshot || isProcessingUpload;
  const ctaButtonLabel = isProcessingUpload ? "Uploading..." : "Change Screenshot";
  const CtaIcon = isProcessingUpload ? Loader2 : RefreshCw;

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
              aria-label="Toggle brand sidebar"
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
            variant="secondary"
            className="hidden items-center gap-2 shadow-none sm:inline-flex"
            onClick={onUploadClick}
            disabled={isProcessingUpload}
            aria-label={isProcessingUpload ? "Uploading Screenshot" : "Change Screenshot"}
            aria-busy={isProcessingUpload}
          >
            <CtaIcon
              className={cn("h-4 w-4", isProcessingUpload && "animate-spin")}
              aria-hidden="true"
            />
            <span>{ctaButtonLabel}</span>
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
            aria-label={isExporting ? "Exporting" : "Export"}
          >
            {isExporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            )}
            Export
          </Button>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
