"use client";

import { useCallback, useRef, type ChangeEvent } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { UploadCloud, Star, Trash2, Minus, X } from "lucide-react";
import { configAtom, assetsAtom, brandSettingsAtom } from "@/hooks/atoms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";
import type { Asset } from "@/domain/asset/types";
import type { LogoSwapSeparator } from "@/domain/layout/types";

interface LogoSwapLogosSectionProps {
  onUploadAsset?: (
    file: File,
    kind: "screenshot" | "logo" | "background" | "avatar",
  ) => void;
  isBrandUser: boolean;
}

const SEPARATOR_OPTIONS: { value: LogoSwapSeparator; icon: React.ReactNode; label: string }[] = [
  { value: "dash", icon: <Minus className="h-3.5 w-3.5 rotate-[20deg]" />, label: "Dash" },
  { value: "x", icon: <X className="h-3.5 w-3.5" />, label: "Cross" },
  { value: "none", icon: <span className="text-[10px] font-medium">Off</span>, label: "None" },
];

export function LogoSwapLogosSection({
  onUploadAsset,
  isBrandUser,
}: LogoSwapLogosSectionProps) {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const assets = useAtomValue(assetsAtom);
  const setAssets = useSetAtom(assetsAtom);
  const brandSettings = useAtomValue(brandSettingsAtom);

  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const logoSwap = config.layoutSpecificSettings?.logoSwap;
  const leftAssetId = logoSwap?.leftLogoAssetId;
  const rightAssetId = logoSwap?.rightLogoAssetId;
  const separatorStyle = logoSwap?.separatorStyle ?? "dash";

  const leftAsset = leftAssetId
    ? assets.find((a) => a.id === leftAssetId)
    : undefined;
  const rightAsset = rightAssetId
    ? assets.find((a) => a.id === rightAssetId)
    : undefined;

  const hasBrandLogo = Boolean(brandSettings.logoUrl && brandSettings.logoPath);

  const updateLogoSwapField = useCallback(
    (field: string, value: string | undefined) => {
      setConfig((prev) => ({
        ...prev,
        layoutSpecificSettings: {
          ...prev.layoutSpecificSettings,
          logoSwap: {
            ...prev.layoutSpecificSettings?.logoSwap,
            [field]: value,
          },
        },
      }));
    },
    [setConfig],
  );

  const handleFileChange = useCallback(
    (position: "left" | "right") => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !onUploadAsset) return;

      onUploadAsset(file, "logo");

      // Assign newly uploaded logo to the correct position
      setTimeout(() => {
        setAssets((currentAssets) => {
          const logoAssets = currentAssets.filter((a) => a.kind === "logo");
          const newLogo = logoAssets[logoAssets.length - 1];
          if (newLogo) {
            const field =
              position === "left" ? "leftLogoAssetId" : "rightLogoAssetId";
            updateLogoSwapField(field, newLogo.id);
          }
          return currentAssets;
        });
      }, 50);

      track("logo_swap_logo_uploaded", { position });

      if (event.target) event.target.value = "";
    },
    [onUploadAsset, setAssets, updateLogoSwapField],
  );

  const handleApplyBrandLogo = useCallback(
    (position: "left" | "right") => {
      if (!brandSettings.logoUrl || !brandSettings.logoPath) return;

      const existing = assets.find(
        (a) => a.kind === "logo" && a.url === brandSettings.logoUrl,
      );

      const brandLogoAsset: Asset = existing ?? {
        id: `brand-logo-${Date.now()}`,
        projectId: "brand",
        userId: "brand",
        url: brandSettings.logoUrl,
        name: brandSettings.logoPath.split("/").pop() || "Brand logo",
        kind: "logo",
        createdAt: new Date().toISOString(),
      };

      if (!existing) {
        setAssets((prev) => [...prev, brandLogoAsset]);
      }

      const field =
        position === "left" ? "leftLogoAssetId" : "rightLogoAssetId";
      updateLogoSwapField(field, brandLogoAsset.id);

      track("logo_swap_brand_logo_applied", { position });
    },
    [assets, brandSettings, setAssets, updateLogoSwapField],
  );

  const handleRemove = useCallback(
    (position: "left" | "right") => {
      const field =
        position === "left" ? "leftLogoAssetId" : "rightLogoAssetId";
      updateLogoSwapField(field, undefined);
      track("logo_swap_logo_removed", { position });
    },
    [updateLogoSwapField],
  );

  const handleSeparatorChange = useCallback(
    (style: LogoSwapSeparator) => {
      updateLogoSwapField("separatorStyle", style);
      track("logo_swap_separator_changed", { style });
    },
    [updateLogoSwapField],
  );

  const renderLogoSlot = (
    position: "left" | "right",
    asset: Asset | undefined,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    const label = position === "left" ? "Left logo" : "Right logo";

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <div className="flex items-center gap-1">
            {asset && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(position)}
                aria-label={`Remove ${label.toLowerCase()}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <input
          type="file"
          className="hidden"
          ref={inputRef}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange(position)}
          aria-hidden="true"
          tabIndex={-1}
        />

        {asset ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/20 transition-colors hover:bg-muted/40"
            aria-label={`Replace ${label.toLowerCase()}`}
          >
            <img
              src={asset.url}
              alt={asset.name}
              className="max-h-16 max-w-[80%] object-contain"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <UploadCloud className="h-4 w-4 text-white" />
            </div>
          </button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!onUploadAsset}
              onClick={() => inputRef.current?.click()}
              className="h-9 flex-1 gap-1.5 text-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload
            </Button>
            {isBrandUser && hasBrandLogo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyBrandLogo(position)}
                className="h-9 gap-1.5 text-xs"
                aria-label={`Use brand logo for ${label.toLowerCase()}`}
              >
                <Star className="h-3.5 w-3.5" />
                Brand
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {renderLogoSlot("left", leftAsset, leftInputRef)}
      {renderLogoSlot("right", rightAsset, rightInputRef)}

      {/* Separator style */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">
          Separator
        </span>
        <div className="flex gap-1">
          {SEPARATOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSeparatorChange(opt.value)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                separatorStyle === opt.value
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
              aria-label={opt.label}
              aria-pressed={separatorStyle === opt.value}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
