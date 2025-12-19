"use client";

import { useAtomValue, useSetAtom, useAtom } from "jotai";
import { useCallback, useRef, type ChangeEvent } from "react";
import { UploadCloud, Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logoAssetAtom, layoutCapabilitiesAtom } from "@/hooks/atoms/derived";
import { configAtom, brandSettingsAtom, assetsAtom } from "@/hooks/atoms";
import type { Asset } from "@/domain/asset/types";

interface LogoSectionProps {
  onUploadAsset?: (file: File, kind: "logo") => void;
}

export function LogoSection({ onUploadAsset }: LogoSectionProps) {
  const logoAsset = useAtomValue(logoAssetAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const [brandSettings] = useAtom(brandSettingsAtom);
  const setConfig = useSetAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleRemove = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      assets: {
        ...currentConfig.assets,
        logo: undefined,
      },
    }));
  }, [setConfig]);

  const handleUseBrandLogo = useCallback(async () => {
    if (!brandSettings.logoUrl || !brandSettings.logoPath) return;

    const brandLogoAsset: Asset = {
      id: `brand-logo-${Date.now()}`,
      projectId: "brand",
      userId: "brand",
      url: brandSettings.logoUrl,
      name: brandSettings.logoPath.split("/").pop() || "brand-logo",
      kind: "logo",
      createdAt: new Date().toISOString(),
    };

    setAssets((prev) => [...prev, brandLogoAsset]);
    setConfig((currentConfig) => ({
      ...currentConfig,
      assets: {
        ...currentConfig.assets,
        logo: brandLogoAsset.id,
      },
    }));
  }, [brandSettings, setConfig, setAssets]);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onUploadAsset) {
        onUploadAsset(file, "logo");
      }
      if (event.target) {
        event.target.value = "";
      }
    },
    [onUploadAsset],
  );

  const handleUploadClick = useCallback(() => {
    if (!onUploadAsset) return;
    uploadInputRef.current?.click();
  }, [onUploadAsset]);

  // Hide section if look doesn't support logos
  if (lookCapabilities?.logo === "hidden") {
    return null;
  }

  const hasBrandLogo = brandSettings.logoUrl && brandSettings.useLogoOnScreenshots;
  const isUsingBrandLogo = logoAsset?.url === brandSettings.logoUrl;
  const hasCustomLogo = logoAsset && !isUsingBrandLogo;

  return (
    <div className="flex flex-col gap-3 pt-2">
      {/* Hidden file input */}
      <input
        type="file"
        className="hidden"
        ref={uploadInputRef}
        accept="image/*"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Brand logo option */}
      {hasBrandLogo && (
        <div
          className={cn(
            "group relative overflow-hidden rounded-lg border transition-all cursor-pointer",
            isUsingBrandLogo
              ? "border-foreground bg-muted/30"
              : "border-border bg-muted/10 hover:border-foreground/30"
          )}
          onClick={!isUsingBrandLogo ? handleUseBrandLogo : undefined}
          role="button"
          tabIndex={0}
        >
          <div
            className="relative h-16 bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px]"
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(0,0,0,0.04) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.04) 75%),
                linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.04) 75%)
              `,
              backgroundColor: 'hsl(var(--muted) / 0.2)'
            }}
          >
            <img
              src={brandSettings.logoUrl || ""}
              alt="Brand logo"
              className="w-full h-full object-contain p-3"
            />
          </div>

          {isUsingBrandLogo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-1.5 right-1.5 rounded-full bg-background/80 p-0.5 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100 z-10"
              aria-label="Remove logo"
            >
              <X className="h-2.5 w-2.5 text-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Custom logo - either uploaded or upload area */}
      {hasCustomLogo ? (
        <div
          className="group relative overflow-hidden rounded-lg border border-foreground bg-muted/30 cursor-pointer transition-colors hover:border-foreground/80"
          onClick={handleUploadClick}
          role="button"
          tabIndex={0}
        >
          <div
            className="relative h-16 bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px]"
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(0,0,0,0.04) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.04) 75%),
                linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.04) 75%)
              `,
              backgroundColor: 'hsl(var(--muted) / 0.2)'
            }}
          >
            <img
              src={logoAsset.url}
              alt={logoAsset.name}
              className="w-full h-full object-contain p-3"
              crossOrigin="anonymous"
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute top-1.5 right-1.5 rounded-full bg-background/80 p-0.5 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100 z-10"
            aria-label="Remove logo"
          >
            <X className="h-2.5 w-2.5 text-foreground" />
          </button>
        </div>
      ) : (
        !isUsingBrandLogo && (
          <div
            role="button"
            tabIndex={onUploadAsset ? 0 : -1}
            onClick={handleUploadClick}
            className={cn(
              "relative flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/10 transition-colors hover:border-foreground/30 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <UploadCloud className="h-5 w-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Upload logo</span>
          </div>
        )
      )}
    </div>
  );
}
