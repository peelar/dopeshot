"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { BackgroundConfig, ColorToken, FontId, FontSize, LayoutConfig, ScreenshotTreatment } from "@/domain/layout/types";
import { Label } from "@/components/ui/label";
import { Asset } from "@/domain/asset/types";
import { UploadCloud } from "lucide-react";
import { cn } from "@/utils";
import { GradientPicker } from "@/components/gradient-picker";
import { FontSelector } from "@/components/font-selector";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DEFAULT_LOCKED_ASPECT_RATIO } from "@/domain/layout/screenshot-mode";
import { Tooltip } from "@/components/ui/tooltip";
import { getTemplateById } from "@/domain/layout/templates";

const DEFAULT_SCREENSHOT_TREATMENT: ScreenshotTreatment = {
  preset: "soft-glass",
  canvasMode: "adaptive",
  lockedAspectRatio: DEFAULT_LOCKED_ASPECT_RATIO,
  shadowEnabled: true,
  shape: "rounded",
};

const FULL_OUTLINE_CONTROLS = {
  softGlass: true,
  shape: true,
  shadow: true,
};

type SidebarTab = "design" | "assets";

interface LayoutConfigProps {
  config: LayoutConfig;
  onConfigChangeAction: (newConfig: LayoutConfig) => void;
  assets?: Asset[];
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
}

interface SidebarFieldLabelProps {
  htmlFor: string;
  children: ReactNode;
}

function SidebarFieldLabel({ htmlFor, children }: SidebarFieldLabelProps) {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-medium text-muted-foreground">
      {children}
    </Label>
  );
}

export const LayoutConfigPanel = ({
  config,
  onConfigChangeAction,
  assets = [],
  onUploadAsset,
}: LayoutConfigProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("design");
  const template = useMemo(() => getTemplateById(config.templateId), [config.templateId]);
  const templateCapabilities = template?.capabilities;
  const outlineControls = templateCapabilities?.outline ?? FULL_OUTLINE_CONTROLS;
  const showHeadlineInput = (templateCapabilities?.text.headline ?? "optional") !== "hidden";
  const showSubtitleInput = (templateCapabilities?.text.subtitle ?? "optional") !== "hidden";
  const showTypographyControls = templateCapabilities?.typography !== false;
  const showOutlineSection =
    outlineControls.softGlass || outlineControls.shape || outlineControls.shadow;
  const showLogoUpload = templateCapabilities?.logo !== "hidden";
  const grainEnabled = config.background?.grainEnabled ?? true;

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

  const handleGradientChange = useCallback(
    (background: BackgroundConfig, textColor: ColorToken) => {
      const grainEnabled = background.grainEnabled ?? config.background?.grainEnabled ?? true;
      onConfigChangeAction({
        ...config,
        colors: {
          ...config.colors,
          text: textColor,
        },
        background: {
          ...background,
          grainEnabled,
        },
      });
    },
    [config, onConfigChangeAction],
  );

  const handleGrainToggle = useCallback(
    (enabled: boolean) => {
      const fallbackBackground =
        config.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
      onConfigChangeAction({
        ...config,
        background: {
          ...fallbackBackground,
          grainEnabled: enabled,
        },
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

  const handleTextInputChange = useCallback(
    (field: "title" | "subtitle", value: string) => {
      onConfigChangeAction({
        ...config,
        text: {
          ...config.text,
          [field]: value,
        },
      });
    },
    [config, onConfigChangeAction],
  );

  const toggleSoftGlass = useCallback(() => {
    const treatment = config.screenshotFrame ?? DEFAULT_SCREENSHOT_TREATMENT;
    const isSoftGlass = treatment.preset === "soft-glass";
    onConfigChangeAction({
      ...config,
      screenshotFrame: {
        ...treatment,
        preset: isSoftGlass ? "solid" : "soft-glass",
        shape: treatment.shape ?? "rounded",
      },
    });
  }, [config, onConfigChangeAction]);

  const handleShapeToggle = useCallback(() => {
    const treatment = config.screenshotFrame ?? DEFAULT_SCREENSHOT_TREATMENT;
    const currentShape = treatment.shape ?? "rounded";
    const nextShape = currentShape === "rounded" ? "rectangular" : "rounded";
    onConfigChangeAction({
      ...config,
      screenshotFrame: {
        ...treatment,
        shape: nextShape,
      },
    });
  }, [config, onConfigChangeAction]);

  const toggleFrameShadow = useCallback(() => {
    const treatment = config.screenshotFrame ?? DEFAULT_SCREENSHOT_TREATMENT;
    onConfigChangeAction({
      ...config,
      screenshotFrame: {
        ...treatment,
        shadowEnabled: !(treatment.shadowEnabled ?? true),
      },
    });
  }, [config, onConfigChangeAction]);

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
            {(showHeadlineInput || showSubtitleInput) && (
              <div className="space-y-3">
                {showHeadlineInput && (
                  <div className="space-y-1.5">
                    <SidebarFieldLabel htmlFor="sidebar-content-title">Headline</SidebarFieldLabel>
                    <input
                      id="sidebar-content-title"
                      value={config.text.title ?? ""}
                      onChange={(event) => handleTextInputChange("title", event.target.value)}
                      placeholder="Bring the heat"
                      className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>
                )}
                {showSubtitleInput && (
                  <div className="space-y-1.5">
                    <SidebarFieldLabel htmlFor="sidebar-content-subtitle">Subtitle</SidebarFieldLabel>
                    <textarea
                      id="sidebar-content-subtitle"
                      value={config.text.subtitle ?? ""}
                      onChange={(event) => handleTextInputChange("subtitle", event.target.value)}
                      placeholder="Keep the heat going"
                      rows={2}
                      className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>
                )}
              </div>
            )}

            {showTypographyControls && (
              <FontSelector
                fontId={config.fontId}
                fontSize={config.fontSize}
                onFontChangeAction={handleFontChange}
                onSizeChangeAction={handleFontSizeChange}
              />
            )}

            {showOutlineSection && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Outline</Label>
                <div className="flex items-center gap-3">
                  {outlineControls.softGlass && (
                    <Tooltip label="Glass">
                      <IconToggleButton
                        active={(config.screenshotFrame?.preset || DEFAULT_SCREENSHOT_TREATMENT.preset) === "soft-glass"}
                        onClick={toggleSoftGlass}
                        ariaLabel="Toggle soft glass outline"
                      >
                        <SoftGlassGlyph active={(config.screenshotFrame?.preset || DEFAULT_SCREENSHOT_TREATMENT.preset) === "soft-glass"} />
                      </IconToggleButton>
                    </Tooltip>
                  )}
                  {outlineControls.shape && (
                    <Tooltip label="Corners">
                      <IconToggleButton
                        active={(config.screenshotFrame?.shape ?? "rounded") === "rounded"}
                        onClick={handleShapeToggle}
                        ariaLabel="Toggle corner style"
                      >
                        <CornerGlyph rounded={(config.screenshotFrame?.shape ?? "rounded") === "rounded"} />
                      </IconToggleButton>
                    </Tooltip>
                  )}
                  {outlineControls.shadow && (
                    <Tooltip label="Shadow">
                      <IconToggleButton
                        active={config.screenshotFrame?.shadowEnabled ?? true}
                        onClick={toggleFrameShadow}
                        ariaLabel="Toggle shadow"
                      >
                        <ShadowGlyph active={config.screenshotFrame?.shadowEnabled ?? true} />
                      </IconToggleButton>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}

            {/* Background Selection */}
            <div className="space-y-3">
              <Label id="bg-type-label" className="text-sm font-medium text-muted-foreground">
                Background
              </Label>

              <GrainToggleControl enabled={grainEnabled} onToggle={handleGrainToggle} />

              <SegmentedControl
                value={bgType}
                onChange={(value) => setBgType(value === "image" ? "image" : "gradient")}
                options={[
                  { id: "gradient", label: "Gradient" },
                  { id: "image", label: "Image" },
                ]}
                ariaLabel="Background type"
              />

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

            {showLogoUpload && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Logo</Label>
                <AssetDropzone
                  asset={logoAsset}
                  onUpload={(file) => onUploadAsset?.(file, "logo")}
                  disabled={!onUploadAsset}
                  label="Drop your logo"
                  variant="logo"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface AssetDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File) => void;
  disabled?: boolean;
  label: string;
  variant?: "default" | "logo";
}

interface GrainToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const GrainToggleControl = ({ enabled, onToggle }: GrainToggleProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Toggle background grain"
      onClick={() => onToggle(!enabled)}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm font-medium text-muted-foreground/90 transition",
        enabled && "text-foreground shadow-sm",
        !enabled && "hover:text-foreground",
      )}
    >
      <span className="text-xs uppercase tracking-[0.25em]">Grain</span>
      <span
        className={cn(
          "rounded-full px-3 py-0.5 text-[11px] font-semibold",
          enabled ? "bg-foreground text-background" : "bg-border/70 text-muted-foreground",
        )}
      >
        {enabled ? "On" : "Off"}
      </span>
    </button>
  );
};

const AssetDropzone = ({
  asset,
  onUpload,
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
      className={cn(
        "group relative w-full rounded-2xl border border-border bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
          "relative overflow-hidden rounded border border-border bg-background",
          variant === "logo" ? "h-16 w-16" : "h-10 w-14",
        )}
      >
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

      <div
        className={cn(
          variant === "logo"
            ? "flex flex-col items-center gap-1 text-center"
            : "flex min-w-0 flex-1 flex-col",
        )}
      >
        <span
          className={cn(
            "font-semibold text-foreground",
            variant === "logo" ? "text-sm" : "text-xs",
          )}
        >
          {asset ? asset.name : label}
        </span>
        <span
          className={cn("text-muted-foreground", variant === "logo" ? "text-xs" : "text-[10px]")}
        >
          {asset ? "Click to replace" : "PNG, JPG"}
        </span>
      </div>
    </div>
  );
};

interface IconToggleButtonProps {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}

function IconToggleButton({ active, onClick, ariaLabel, children }: IconToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "inline-flex h-12 w-12 items-center justify-center rounded-xl border text-muted-foreground transition",
        active
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border bg-background hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SoftGlassGlyph({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <linearGradient id="soft-glass-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={active ? 0.45 : 0.15} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={active ? 0.2 : 0.05} />
        </linearGradient>
      </defs>
      <rect
        x="5"
        y="5"
        width="18"
        height="18"
        rx="8"
        fill="url(#soft-glass-gradient)"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity={active ? 0.9 : 0.7}
      />
      <rect
        x="8.5"
        y="8"
        width="9"
        height="4"
        rx="2"
        fill="currentColor"
        opacity={active ? 0.5 : 0.2}
      />
    </svg>
  );
}

function ShadowGlyph({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect
        x="6"
        y="6"
        width="16"
        height="11"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <ellipse
        cx="14"
        cy="19"
        rx="6.5"
        ry="2.8"
        fill="currentColor"
        opacity={active ? 0.35 : 0.15}
      />
    </svg>
  );
}

function CornerGlyph({ rounded }: { rounded: boolean }) {
  if (rounded) {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path
          d="M8 22V13C8 9.68629 10.6863 7 14 7H22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M8 22V8H22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
