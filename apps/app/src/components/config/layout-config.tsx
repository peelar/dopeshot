"use client";

import { useRef, type ChangeEvent, useCallback } from "react";
import { useAtomValue } from "jotai";
import { Asset } from "@/domain/asset/types";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { configAtom, orientationAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom, screenshotAssetAtom, logoAssetAtom } from "@/hooks/atoms/derived";
import { ScreenshotSection } from "@/components/sidebar/screenshot-section";
import { LogoSection } from "@/components/sidebar/logo-section";
import { BackgroundSection } from "@/components/sidebar/background-section";
import { LayoutSection } from "@/components/sidebar/layout-section";
import { EffectsSection } from "@/components/sidebar/effects-section";
import { CodeSection } from "@/components/sidebar/code-section";

interface LayoutConfigProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
}

export const LayoutConfigPanel = ({ onUploadAsset }: LayoutConfigProps) => {
  const config = useAtomValue(configAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const logoAsset = useAtomValue(logoAssetAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const orientation = useAtomValue(orientationAtom);

  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const showLogoSection = lookCapabilities?.logo !== "hidden";
  const showCodeSection = config.layoutId === "code-snippet";

  // Check if text is actually supported (not just hidden by layout type)
  const isPeakLeftOrRight = config.layoutId === "popup-gradient-left" || config.layoutId === "popup-gradient-right";
  const hideTextOnMobile = orientation === "mobile" && isPeakLeftOrRight;
  const hasHeadlineSupport = !hideTextOnMobile && (lookCapabilities?.text.headline ?? "optional") !== "hidden";
  const hasSubtitleSupport = !hideTextOnMobile && (lookCapabilities?.text.subtitle ?? "optional") !== "hidden";
  const showTextSection = !showCodeSection && (hasHeadlineSupport || hasSubtitleSupport);

  const handleHeaderFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, kind: "screenshot" | "logo") => {
      const file = event.target.files?.[0];
      if (file && onUploadAsset) {
        onUploadAsset(file, kind);
      }
      if (event.target) {
        event.target.value = "";
      }
    },
    [onUploadAsset],
  );

  const handleHeaderUploadClick = useCallback(
    (event: React.MouseEvent, kind: "screenshot" | "logo") => {
      event.stopPropagation();
      if (!onUploadAsset) return;
      if (kind === "screenshot") {
        screenshotInputRef.current?.click();
        return;
      }
      logoInputRef.current?.click();
    },
    [onUploadAsset],
  );



  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="flex flex-col gap-6 pb-6 pt-6">
        {showTextSection && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Text</span>
            </div>
            <LayoutSection />
          </section>
        )}

        {showCodeSection && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Code</span>
            </div>
            <CodeSection />
          </section>
        )}

        {!showCodeSection && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Effects</span>
            </div>
            <EffectsSection />
          </section>
        )}

        <section className="space-y-3 px-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-semibold">Background</span>
          </div>
          <BackgroundSection />
        </section>

        {!showCodeSection && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Screenshot</span>
              <div className="flex items-center">
                <input
                  type="file"
                  className="hidden"
                  ref={screenshotInputRef}
                  accept="image/*"
                  onChange={(event) => handleHeaderFileChange(event, "screenshot")}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={!onUploadAsset}
                  onClick={(event) => handleHeaderUploadClick(event, "screenshot")}
                  className={cn(
                    "h-6 px-2 text-xs",
                    screenshotAsset
                      ? "text-foreground underline decoration-muted-foreground/60 underline-offset-2 hover:text-foreground/80 hover:decoration-foreground/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {screenshotAsset ? (
                    <span className="max-w-[8rem] truncate" title={screenshotAsset.name}>
                      {screenshotAsset.name}
                    </span>
                  ) : (
                    <span className="max-w-[8rem] truncate" title="Choose file">
                      Choose file...
                    </span>
                  )}
                </Button>
              </div>
            </div>
            <ScreenshotSection onUploadAsset={onUploadAsset} />
          </section>
        )}

        {showLogoSection && (
          <section className="space-y-3 px-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">Logo</span>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={(event) => handleHeaderFileChange(event, "logo")}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={!onUploadAsset}
                  onClick={(event) => handleHeaderUploadClick(event, "logo")}
                  className={cn(
                    "h-6 gap-1.5 px-2 text-xs",
                    logoAsset
                      ? "text-foreground underline decoration-muted-foreground/60 underline-offset-2 hover:text-foreground/80 hover:decoration-foreground/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {!logoAsset && <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />}
                  {logoAsset ? (
                    <span className="max-w-[8rem] truncate" title={logoAsset.name}>
                      {logoAsset.name}
                    </span>
                  ) : (
                    <span className="max-w-[8rem] truncate" title="Choose file">
                      Choose file...
                    </span>
                  )}
                </Button>
              </div>
            </div>
            <LogoSection onUploadAsset={onUploadAsset} />
          </section>
        )}
      </div>
    </div>
  );
};

// Export AssetDropzone for use in section components
export interface AssetDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
  label: string;
  variant?: "default" | "logo";
}

export const AssetDropzone = ({
  asset,
  onUpload,
  onRemove,
  disabled,
  label,
  variant = "default",
}: AssetDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    (file?: File) => {
      if (!file || !onUpload) return;
      onUpload(file);
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
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    },
    [onRemove],
  );

  const ariaLabel = asset
    ? `${label}: ${asset.name}. Press Enter to replace`
    : `${label}. Press Enter to upload`;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "group relative h-auto w-full rounded-lg border border-border bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50",
        variant === "logo"
          ? "flex min-h-[120px] flex-col items-center gap-4 px-4 py-4"
          : "flex min-h-[72px] items-center gap-3 px-3 py-2",
      )}
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />

      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-background",
          variant === "logo" ? "h-16 w-16" : "h-10 w-14",
        )}
      >
        {asset ? (
          <>
            <img
              src={asset.url}
              alt={`Preview of ${asset.name}`}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
            {asset && onRemove && (
              <Button
                type="button"
                onClick={handleRemove}
                aria-label="Remove asset"
                variant="ghost"
                size="sm"
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4 text-white" aria-hidden="true" />
              </Button>
            )}
          </>
        ) : (
          <UploadCloud className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div
        className={cn(
          variant === "logo"
            ? "flex flex-col items-center gap-1 text-center"
            : "flex min-w-0 flex-1 flex-col",
        )}
      >
        <span
          className={cn(
            "w-full truncate font-semibold text-foreground",
            variant === "logo" ? "text-sm" : "text-xs",
          )}
          title={asset?.name ?? label}
        >
          {asset ? asset.name : label}
        </span>
        <span
          className={cn("text-muted-foreground", "text-xs")}
        >
          {asset ? "Click to replace" : "PNG, JPG"}
        </span>
      </div>
    </Button>
  );
};
