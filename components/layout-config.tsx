"use client";

import { useRef, useState, type ChangeEvent, useEffect } from "react";
import { BackgroundConfig, ColorToken, LayoutConfig, ShadowIntensity } from "@/domain/layout/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Asset } from "@/domain/asset/types";
import { UploadCloud } from "lucide-react";
import { cn } from "@/utils";
import { GradientPicker } from "@/components/gradient-picker";

type SidebarTab = "design" | "assets";

interface LayoutConfigProps {
  config: LayoutConfig;
  onConfigChangeAction: (newConfig: LayoutConfig) => void;
  assets?: Asset[];
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
}

export const LayoutConfigPanel = ({
  config,
  onConfigChangeAction,
  assets = [],
  onUploadAsset,
}: LayoutConfigProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("design");

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

  const handleGradientChange = (background: BackgroundConfig, textColor: ColorToken) => {
    onConfigChangeAction({
      ...config,
      colors: {
        ...config.colors,
        text: textColor,
      },
      background,
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tab Header */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("design")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "design"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Design
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "assets"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Assets
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "design" && (
          <div className="space-y-6">
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
                      "flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 transition-all",
                      (config.screenshotShadow || "medium") === intensity
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <ShadowIcon intensity={intensity} />
                    <span className="text-[10px] capitalize text-muted-foreground">
                      {intensity}
                    </span>
                  </button>
                ))}
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
                <GradientPicker
                  background={config.background}
                  colorPalette={screenshotAsset?.colorPalette}
                  onChangeAction={handleGradientChange}
                />
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
          </div>
        )}

        {activeTab === "assets" && (
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
        )}
      </div>
    </div>
  );
};

function ShadowIcon({ intensity }: { intensity: ShadowIntensity }) {
  const shadows: Record<ShadowIntensity, { offset: number; opacity: number }> = {
    low: { offset: 1, opacity: 0.15 },
    medium: { offset: 2, opacity: 0.25 },
    high: { offset: 3, opacity: 0.4 },
  };

  const { offset, opacity } = shadows[intensity];

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="overflow-visible">
      {/* Shadow - using a solid offset instead of blur for cleaner rendering */}
      <rect
        x={8 + offset}
        y={8 + offset}
        width="16"
        height="16"
        rx="2"
        fill="currentColor"
        className="text-foreground"
        style={{ opacity }}
      />
      {/* Card */}
      <rect
        x="8"
        y="8"
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
