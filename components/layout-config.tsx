"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { getTemplateById } from "@/domain/layout/templates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Asset } from "@/domain/asset/types";
import { UploadCloud } from "lucide-react";

interface LayoutConfigProps {
  config: LayoutConfig;
  onConfigChangeAction: (newConfig: LayoutConfig) => void;
  assets?: Asset[];
  activeAssetId?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo") => void;
}

export const LayoutConfigPanel = ({
  config,
  onConfigChangeAction,
  assets = [],
  activeAssetId,
  onUploadAsset,
}: LayoutConfigProps) => {
  const currentTemplate = getTemplateById(config.templateId);
  const screenshotAsset = config.assets.screenshot
    ? assets.find((asset) => asset.id === config.assets.screenshot)
    : undefined;
  const logoAsset = config.assets.logo
    ? assets.find((asset) => asset.id === config.assets.logo)
    : undefined;

  const handleTextChange = (field: "title" | "subtitle", value: string) => {
    onConfigChangeAction({
      ...config,
      text: { ...config.text, [field]: value },
    });
  };

  return (
    <div className="flex h-full flex-col p-4">
      <h3 className="text-foreground mb-4 text-sm font-medium">Configuration</h3>

      <div className="flex-1 space-y-6 overflow-y-auto py-2 pr-2">
        {/* Text Inputs */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Title</Label>
            <Input
              value={config.text.title}
              onChange={(e) => handleTextChange("title", e.target.value)}
              placeholder="Project Title"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Subtitle</Label>
            <Input
              value={config.text.subtitle || ""}
              onChange={(e) => handleTextChange("subtitle", e.target.value)}
              placeholder="A short description"
            />
          </div>
        </div>

        {/* Assets */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Screenshot</Label>
            <AssetDropzone
              asset={screenshotAsset}
              onUpload={(file) => onUploadAsset?.(file, "screenshot")}
              disabled={!onUploadAsset}
              label="Upload Screenshot"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Logo</Label>
            <AssetDropzone
              asset={logoAsset}
              onUpload={(file) => onUploadAsset?.(file, "logo")}
              disabled={!onUploadAsset}
              label="Upload Logo"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface AssetDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File) => void;
  disabled?: boolean;
  label: string;
}

const AssetDropzone = ({ asset, onUpload, disabled, label }: AssetDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File) => {
    if (!file || !onUpload) return;
    onUpload(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div
      role="button"
      onClick={handleClick}
      className={`group relative flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div className="bg-background relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-border">
        {asset ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <UploadCloud className="text-muted-foreground h-4 w-4" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-foreground truncate text-xs font-medium">
          {asset ? asset.name : label}
        </span>
        <span className="text-muted-foreground truncate text-[10px]">
          {asset ? "Click to replace" : "PNG, JPG"}
        </span>
      </div>
    </div>
  );
};
