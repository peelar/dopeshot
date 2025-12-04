"use client";

import { LayoutConfigPanel } from "@/components/layout-config";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/utils";
import { ImageUp, Palette } from "lucide-react";

interface MobileActionsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadClick: () => void;
  isProcessingUpload: boolean;
  onUploadAsset: (file: File, kind: "screenshot" | "logo" | "background") => void;
}

export function MobileActions({
  isOpen,
  onOpenChange,
  onUploadClick,
  isProcessingUpload,
  onUploadAsset,
}: MobileActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:hidden">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2">
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex h-12 basis-2/3 items-center gap-3 rounded-md bg-gradient-to-r from-foreground to-foreground/90 px-4 text-left text-sm font-semibold text-background transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
            >
              <Palette className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-semibold">Design</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[82vh] w-full max-w-none rounded-t-3xl border border-border bg-background px-5 pb-10 pt-5 sm:hidden"
          >
            <div className="mx-auto h-1.5 w-14 rounded-full bg-muted-foreground/30" aria-hidden="true" />
            <SheetHeader className="mt-4 text-left">
              <SheetTitle className="text-base font-semibold text-foreground">Design</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Tune colors, text, and framing.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 h-[calc(100%-100px)] overflow-y-auto">
              <LayoutConfigPanel onUploadAsset={onUploadAsset} />
            </div>
          </SheetContent>
        </Sheet>

        <button
          type="button"
          onClick={onUploadClick}
          disabled={isProcessingUpload}
          className="flex h-12 basis-1/3 items-center justify-center gap-2 rounded-md border border-border/60 bg-muted/80 px-4 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:opacity-60"
        >
          <ImageUp className={cn("h-4 w-4", isProcessingUpload && "animate-spin")} aria-hidden="true" />
          <span className="text-sm font-semibold">{isProcessingUpload ? "Uploading..." : "Upload"}</span>
        </button>
      </div>
    </div>
  );
}
