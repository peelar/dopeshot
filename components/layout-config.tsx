"use client";

import { useRef, useState, type ChangeEvent, useEffect } from "react";
import { LayoutConfig, ShadowIntensity } from "@/domain/layout/types";
import { getTemplateById } from "@/domain/layout/templates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Asset } from "@/domain/asset/types";
import { UploadCloud } from "lucide-react";
import { GRADIENTS, getGradientById } from "@/domain/layout/gradients";
import { cn } from "@/utils";

interface LayoutConfigProps {
  config: LayoutConfig;
  onConfigChangeAction: (newConfig: LayoutConfig) => void;
  assets?: Asset[];
  activeAssetId?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
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
  const backgroundAsset = config.assets.background
    ? assets.find((asset) => asset.id === config.assets.background)
    : undefined;

  // Local state for background tab selection (default to current config type or gradient)
  const [bgType, setBgType] = useState<"gradient" | "image">(
    config.background?.type === "image" ? "image" : "gradient",
  );

  // Sync local state with config type when it changes externally (e.g. template switch)
  useEffect(() => {
    if (config.background?.type) {
      // Only sync if the type matches one of our tabs.
      // If solid, we might default to gradient or handle it differently,
      // but for now we only have gradient/image UI.
      if (config.background.type === "image") {
        setBgType("image");
      } else if (config.background.type === "gradient") {
        setBgType("gradient");
      }
    }
  }, [config.background?.type]);

  const handleTextChange = (field: "title" | "subtitle", value: string) => {
    onConfigChangeAction({
      ...config,
      text: { ...config.text, [field]: value },
    });
  };

  const handleGradientSelect = (gradientId: string) => {
    const gradient = getGradientById(gradientId);

    onConfigChangeAction({
      ...config,
      colors: {
        ...config.colors,
        text: gradient?.textColor || "slate-900",
      },
      background: { type: "gradient", value: gradientId },
    });
  };

  return (
    <div className="flex h-full flex-col p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">Configuration</h3>

      <div className="flex-1 space-y-6 overflow-y-auto py-2 pr-2">
        {/* Text Inputs */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={config.text.title}
              onChange={(e) => handleTextChange("title", e.target.value)}
              placeholder="Project Title"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Subtitle</Label>
            <Input
              value={config.text.subtitle || ""}
              onChange={(e) => handleTextChange("subtitle", e.target.value)}
              placeholder="A short description"
            />
          </div>
        </div>

        {/* Background Selection */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Background</Label>

          <div className="flex rounded-md bg-muted p-1">
            <button
              onClick={() => setBgType("gradient")}
              className={cn(
                "flex-1 rounded-sm py-1 text-xs transition-all",
                bgType === "gradient"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Gradient
            </button>
            <button
              onClick={() => setBgType("image")}
              className={cn(
                "flex-1 rounded-sm py-1 text-xs transition-all",
                bgType === "image"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Image
            </button>
          </div>

          {bgType === "gradient" && (
            <div className="grid grid-cols-2 gap-2">
              {GRADIENTS.map((g) => (
                <div
                  key={g.id}
                  className={cn(
                    "h-12 cursor-pointer rounded-md border transition-all hover:opacity-90",
                    config.background?.type === "gradient" && config.background?.value === g.id
                      ? "border-primary ring-1 ring-primary"
                      : "border-border",
                  )}
                  style={{ background: g.value }}
                  onClick={() => handleGradientSelect(g.id)}
                  title={g.name}
                />
              ))}
            </div>
          )}

          {bgType === "image" && (
            <div className="space-y-2">
              <AssetDropzone
                asset={backgroundAsset}
                onUpload={(file) => onUploadAsset?.(file, "background")}
                disabled={!onUploadAsset}
                label="Upload Background"
              />
              {config.background?.type === "image" && !backgroundAsset && (
                <p className="text-xs text-yellow-600">
                  Background image not found. Please upload again.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Assets */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Screenshot</Label>
            <AssetDropzone
              asset={screenshotAsset}
              onUpload={(file) => onUploadAsset?.(file, "screenshot")}
              disabled={!onUploadAsset}
              label="Upload Screenshot"
            />
          </div>

          {/* Screenshot Shadow */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Shadow</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((intensity) => (
                <button
                  key={intensity}
                  onClick={() =>
                    onConfigChangeAction({
                      ...config,
                      screenshotShadow: intensity,
                    })
                  }
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md border p-3 transition-all",
                    (config.screenshotShadow || "medium") === intensity
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <ShadowIcon intensity={intensity} />
                  <span className="text-[10px] capitalize text-muted-foreground">{intensity}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Logo</Label>
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

function ShadowIcon({ intensity }: { intensity: ShadowIntensity }) {
  const shadows: Record<ShadowIntensity, { blur: number; opacity: number }> = {
    low: { blur: 1, opacity: 0.15 },
    medium: { blur: 2, opacity: 0.25 },
    high: { blur: 4, opacity: 0.4 },
  };

  const { blur, opacity } = shadows[intensity];

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      {/* Shadow */}
      <rect
        x={6 + blur}
        y={6 + blur}
        width="16"
        height="16"
        rx="2"
        fill="currentColor"
        className="text-foreground"
        style={{ opacity, filter: `blur(${blur}px)` }}
      />
      {/* Card */}
      <rect
        x="6"
        y="6"
        width="16"
        height="16"
        rx="2"
        className="fill-background stroke-border"
        strokeWidth="1.5"
      />
    </svg>
  );
}

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

      <div className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-background">
        {asset ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <UploadCloud className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium text-foreground">
          {asset ? asset.name : label}
        </span>
        <span className="truncate text-[10px] text-muted-foreground">
          {asset ? "Click to replace" : "PNG, JPG"}
        </span>
      </div>
    </div>
  );
};
