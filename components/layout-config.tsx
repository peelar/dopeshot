"use client";

import { useRef, useState, type ChangeEvent, useEffect, useMemo, useCallback } from "react";
import {
  BackgroundConfig,
  ColorToken,
  FontId,
  FontSize,
  LayoutConfig,
  ShadowIntensity,
} from "@/domain/layout/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Asset } from "@/domain/asset/types";
import { UploadCloud } from "lucide-react";
import { cn } from "@/utils";
import { GradientPicker } from "@/components/gradient-picker";
import { FontSelector } from "@/components/font-selector";

type SidebarTab = "design" | "assets";

// Debounced input component that manages local state and delays parent updates
function DebouncedInput({
  value,
  onChange,
  delay = 100,
  ...props
}: Omit<React.ComponentProps<"input">, "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local state when external value changes (e.g., template switch)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, delay);
  };

  return <Input {...props} value={localValue} onChange={handleChange} />;
}

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

  // Memoize asset lookups to avoid recalculating on every render
  const { screenshotAsset, logoAsset, backgroundAsset } = useMemo(
    () => ({
      screenshotAsset: config.assets.screenshot
        ? assets.find((asset) => asset.id === config.assets.screenshot)
        : undefined,
      logoAsset: config.assets.logo
        ? assets.find((asset) => asset.id === config.assets.logo)
        : undefined,
      backgroundAsset: config.assets.background
        ? assets.find((asset) => asset.id === config.assets.background)
        : undefined,
    }),
    [assets, config.assets.screenshot, config.assets.logo, config.assets.background],
  );

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

  const handleTextChange = useCallback(
    (field: "title" | "subtitle", value: string) => {
      onConfigChangeAction({
        ...config,
        text: { ...config.text, [field]: value },
      });
    },
    [config, onConfigChangeAction],
  );

  const handleGradientChange = useCallback(
    (background: BackgroundConfig, textColor: ColorToken) => {
      onConfigChangeAction({
        ...config,
        colors: {
          ...config.colors,
          text: textColor,
        },
        background,
      });
    },
    [config, onConfigChangeAction],
  );

  const handleFontChange = useCallback(
    (fontId: FontId) => {
      onConfigChangeAction({
        ...config,
        fontId,
      });
    },
    [config, onConfigChangeAction],
  );

  const handleFontSizeChange = useCallback(
    (fontSize: FontSize) => {
      onConfigChangeAction({
        ...config,
        fontSize,
      });
    },
    [config, onConfigChangeAction],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Tab Header */}
      <div
        role="tablist"
        aria-label="Configuration options"
        className="flex border-b border-border"
      >
        <button
          type="button"
          role="tab"
          id="tab-design"
          aria-selected={activeTab === "design"}
          aria-controls="tabpanel-design"
          tabIndex={activeTab === "design" ? 0 : -1}
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
          type="button"
          role="tab"
          id="tab-assets"
          aria-selected={activeTab === "assets"}
          aria-controls="tabpanel-assets"
          tabIndex={activeTab === "assets" ? 0 : -1}
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
          <div
            role="tabpanel"
            id="tabpanel-design"
            aria-labelledby="tab-design"
            className="space-y-6"
          >
            {/* Text Inputs */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title-input" className="text-xs text-muted-foreground">
                  Title
                </Label>
                <DebouncedInput
                  id="title-input"
                  value={config.text.title}
                  onChange={(value) => handleTextChange("title", value)}
                  placeholder="Project Title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle-input" className="text-xs text-muted-foreground">
                  Subtitle
                </Label>
                <DebouncedInput
                  id="subtitle-input"
                  value={config.text.subtitle || ""}
                  onChange={(value) => handleTextChange("subtitle", value)}
                  placeholder="A short description"
                />
              </div>
            </div>

            {/* Typography */}
            <FontSelector
              fontId={config.fontId}
              fontSize={config.fontSize}
              onFontChangeAction={handleFontChange}
              onSizeChangeAction={handleFontSizeChange}
            />

            {/* Screenshot Shadow */}
            <div className="space-y-2">
              <Label id="shadow-label" className="text-xs text-muted-foreground">
                Shadow
              </Label>
              <div
                role="radiogroup"
                aria-labelledby="shadow-label"
                className="grid grid-cols-3 gap-2"
              >
                {(["low", "medium", "high"] as const).map((intensity) => {
                  const isSelected = (config.screenshotShadow || "medium") === intensity;
                  return (
                    <button
                      key={intensity}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${intensity} shadow intensity`}
                      onClick={() =>
                        onConfigChangeAction({
                          ...config,
                          screenshotShadow: intensity,
                        })
                      }
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <ShadowIcon intensity={intensity} />
                      <span className="text-[10px] capitalize text-muted-foreground">
                        {intensity}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Selection */}
            <div className="space-y-3">
              <Label id="bg-type-label" className="text-xs text-muted-foreground">
                Background
              </Label>

              <div
                role="radiogroup"
                aria-labelledby="bg-type-label"
                className="flex rounded-md bg-muted p-1"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={bgType === "gradient"}
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
                  type="button"
                  role="radio"
                  aria-checked={bgType === "image"}
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
          <div
            role="tabpanel"
            id="tabpanel-assets"
            aria-labelledby="tab-assets"
            className="space-y-4"
          >
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled],
  );

  const ariaLabel = asset
    ? `${label}: ${asset.name}. Press Enter to replace`
    : `${label}. Press Enter to upload`;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
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
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-background">
        {asset ? (
          <img
            src={asset.url}
            alt={`Preview of ${asset.name}`}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <UploadCloud className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
