"use client";

import type { Asset } from "@/domain/asset/types";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";
import { cn } from "@/utils";
import { useAtomValue } from "jotai";
import { UploadCloud } from "lucide-react";
import { useCallback, useRef, type ChangeEvent } from "react";

interface ScreenshotSectionProps {
  onUploadAsset?: (file: File, kind: "screenshot") => void;
}

export function ScreenshotSection({ onUploadAsset }: ScreenshotSectionProps) {
  const screenshotAsset = useAtomValue(screenshotAssetAtom);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenshotDropzone asset={screenshotAsset} onUpload={onUploadAsset} />
    </div>
  );
}

interface ScreenshotDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File, kind: "screenshot") => void;
}

function ScreenshotDropzone({ asset, onUpload }: ScreenshotDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    (file?: File) => {
      if (!file || !onUpload) return;
      onUpload(file, "screenshot");
    },
    [onUpload],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      handleFile(file);
      if (event.target) {
        event.target.value = "";
      }
    },
    [handleFile],
  );

  const handleClick = useCallback(() => {
    if (!onUpload) return;
    inputRef.current?.click();
  }, [onUpload]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!onUpload) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [onUpload],
  );

  const ariaLabel = asset
    ? `Screenshot: ${asset.name}. Press Enter to replace`
    : "Upload screenshot. Press Enter to select file";

  if (!asset) {
    return (
      <div
        role="button"
        tabIndex={onUpload ? 0 : -1}
        aria-label={ariaLabel}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 transition-colors hover:border-border/60 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <input
          type="file"
          className="hidden"
          ref={inputRef}
          accept="image/*"
          onChange={handleInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />
        <UploadCloud className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-semibold text-foreground">Upload screenshot</span>
          <span className="text-xs text-muted-foreground">PNG, JPG, SVG up to 10MB</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={onUpload ? 0 : -1}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        accept="image/*"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="relative aspect-video w-full">
        <img
          src={asset.url}
          alt={`Preview of ${asset.name}`}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
          <span className="text-sm font-semibold text-white">Click to replace</span>
        </div>
      </div>
    </div>
  );
}
