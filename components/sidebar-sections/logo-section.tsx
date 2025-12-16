"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef, type ChangeEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/utils";
import { logoAssetAtom, layoutCapabilitiesAtom } from "@/hooks/atoms/derived";
import { configAtom } from "@/hooks/atoms";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/domain/asset/types";

interface LogoSectionProps {
  onUploadAsset?: (file: File, kind: "logo") => void;
}

export function LogoSection({ onUploadAsset }: LogoSectionProps) {
  const logoAsset = useAtomValue(logoAssetAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const setConfig = useSetAtom(configAtom);

  const handleRemove = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      assets: {
        ...currentConfig.assets,
        logo: undefined,
      },
    }));
  }, [setConfig]);

  // Hide section if look doesn't support logos
  if (lookCapabilities?.logo === "hidden") {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <LogoDropzone asset={logoAsset} onUpload={onUploadAsset} onRemove={handleRemove} />
    </div>
  );
}

interface LogoDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File, kind: "logo") => void;
  onRemove?: () => void;
}

function LogoDropzone({ asset, onUpload, onRemove }: LogoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    (file?: File) => {
      if (!file || !onUpload) return;
      onUpload(file, "logo");
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

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    },
    [onRemove],
  );

  const ariaLabel = asset
    ? `Logo: ${asset.name}. Press Enter to replace`
    : "Add your logo (optional). Press Enter to select file";

  if (!asset) {
    return (
      <div
        role="button"
        tabIndex={onUpload ? 0 : -1}
        aria-label={ariaLabel}
        onClick={handleClick}
        className={cn(
          "group relative flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 transition-colors hover:border-border/60 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
        <UploadCloud className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-semibold text-foreground">Add your logo</span>
          <span className="text-xs text-muted-foreground">PNG, SVG recommended</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={onUpload ? 0 : -1}
        aria-label={ariaLabel}
        onClick={handleClick}
        className={cn(
          "group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-background p-4 transition-colors hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
        <div className="relative flex h-20 items-center justify-center">
          <img
            src={asset.url}
            alt={`Preview of ${asset.name}`}
            className="max-h-full max-w-full object-contain"
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {onRemove && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClick} className="flex-1 text-xs">
            Replace
          </Button>
          <Button variant="outline" onClick={handleRemoveClick} className="flex-1 text-xs">
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
