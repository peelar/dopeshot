"use client";

import type { Asset } from "@/domain/asset/types";
import { screenshotAssetAtom } from "@/hooks/atoms/derived";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
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

  const ariaLabel = asset
    ? `Screenshot: ${asset.name}. Press Enter to replace`
    : "Upload screenshot. Press Enter to select file";

  if (!asset) {
    return (
      <Button
        type="button"
        variant="ghost"
        aria-label={ariaLabel}
        disabled={!onUpload}
        onClick={handleClick}
        className={cn(
          "group relative flex h-auto w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/10 p-0 transition-colors hover:border-foreground/30 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
        <UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-xs font-medium text-foreground">Upload screenshot</span>
          <span className="text-xs text-muted-foreground">PNG, JPG, SVG</span>
        </div>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={ariaLabel}
      disabled={!onUpload}
      onClick={handleClick}
      className={cn(
        "group relative h-auto w-full cursor-pointer overflow-hidden rounded-lg border border-foreground bg-muted/30 p-0 transition-colors hover:border-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
      </div>
    </Button>
  );
}
