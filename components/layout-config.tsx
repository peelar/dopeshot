"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  useEffect,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  BackgroundConfig,
  ColorToken,
  FontId,
  FontSize,
  ScreenshotTreatment,
} from "@/domain/layout/types";
import { Label } from "@/components/ui/label";
import { Asset } from "@/domain/asset/types";
import { UploadCloud } from "lucide-react";
import { cn } from "@/utils";
import { GradientPicker } from "@/components/gradient-picker";
import { FontSelector } from "@/components/font-selector";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DEFAULT_LOCKED_ASPECT_RATIO } from "@/domain/layout/screenshot-mode";
import { configAtom } from "@/hooks/atoms";
import {
  currentTemplateAtom,
  templateCapabilitiesAtom,
  screenshotAssetAtom,
  logoAssetAtom,
  backgroundAssetAtom,
} from "@/hooks/atoms/derived";

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

export const LayoutConfigPanel = ({ onUploadAsset }: LayoutConfigProps) => {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const [activeTab, setActiveTab] = useState<SidebarTab>("design");
  const template = useAtomValue(currentTemplateAtom);
  const templateCapabilities = useAtomValue(templateCapabilitiesAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const logoAsset = useAtomValue(logoAssetAtom);
  const backgroundAsset = useAtomValue(backgroundAssetAtom);
  const outlineControls = templateCapabilities?.outline ?? FULL_OUTLINE_CONTROLS;
  const showHeadlineInput = (templateCapabilities?.text.headline ?? "optional") !== "hidden";
  const showSubtitleInput = (templateCapabilities?.text.subtitle ?? "optional") !== "hidden";
  const showTypographyControls = templateCapabilities?.typography !== false;
  const showOutlineSection =
    outlineControls.softGlass || outlineControls.shape || outlineControls.shadow;
  const showLogoUpload = templateCapabilities?.logo !== "hidden";
  const grainEnabled = config.background?.grainEnabled ?? true;

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
      setConfig((currentConfig) => {
        const grainEnabled =
          background.grainEnabled ?? currentConfig.background?.grainEnabled ?? true;
        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: {
            ...background,
            grainEnabled,
          },
        };
      });
    },
    [setConfig],
  );

  const handleGrainToggle = useCallback(
    (enabled: boolean) => {
      setConfig((currentConfig) => {
        const fallbackBackground =
          currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
        return {
          ...currentConfig,
          background: {
            ...fallbackBackground,
            grainEnabled: enabled,
          },
        };
      });
    },
    [setConfig],
  );

  const handleFontChange = useCallback(
    (fontId: FontId) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        fontId,
      }));
    },
    [setConfig],
  );

  const handleFontSizeChange = useCallback(
    (fontSize: FontSize) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        fontSize,
      }));
    },
    [setConfig],
  );

  const handleTextInputChange = useCallback(
    (field: "title" | "subtitle", value: string) => {
      setConfig((currentConfig) => ({
        ...currentConfig,
        text: {
          ...currentConfig.text,
          [field]: value,
        },
      }));
    },
    [setConfig],
  );

  const toggleSoftGlass = useCallback(() => {
    setConfig((currentConfig) => {
      const treatment = currentConfig.screenshotFrame ?? DEFAULT_SCREENSHOT_TREATMENT;
      const isSoftGlass = treatment.preset === "soft-glass";
      return {
        ...currentConfig,
        screenshotFrame: {
          ...treatment,
          preset: isSoftGlass ? "solid" : "soft-glass",
          shape: treatment.shape ?? "rounded",
        },
      };
    });
  }, [setConfig]);

  const handleShapeToggle = useCallback(() => {
    setConfig((currentConfig) => {
      const treatment = currentConfig.screenshotFrame ?? DEFAULT_SCREENSHOT_TREATMENT;
      const currentShape = treatment.shape ?? "rounded";
      const nextShape = currentShape === "rounded" ? "rectangular" : "rounded";
      return {
        ...currentConfig,
        screenshotFrame: {
          ...treatment,
          shape: nextShape,
        },
      };
    });
  }, [setConfig]);

  const toggleFrameShadow = useCallback(() => {
    setConfig((currentConfig) => {
      const treatment = currentConfig.screenshotFrame ?? DEFAULT_SCREENSHOT_TREATMENT;
      return {
        ...currentConfig,
        screenshotFrame: {
          ...treatment,
          shadowEnabled: !(treatment.shadowEnabled ?? true),
        },
      };
    });
  }, [setConfig]);

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
                    <SidebarFieldLabel htmlFor="sidebar-content-subtitle">
                      Subtitle
                    </SidebarFieldLabel>
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

            <EffectsSection
              showGlass={outlineControls.softGlass}
              showCorners={outlineControls.shape}
              showShadow={outlineControls.shadow}
              glassEnabled={
                (config.screenshotFrame?.preset || DEFAULT_SCREENSHOT_TREATMENT.preset) ===
                "soft-glass"
              }
              cornersRounded={(config.screenshotFrame?.shape ?? "rounded") === "rounded"}
              shadowEnabled={config.screenshotFrame?.shadowEnabled ?? true}
              grainEnabled={grainEnabled}
              onToggleGlass={toggleSoftGlass}
              onToggleCorners={handleShapeToggle}
              onToggleShadow={toggleFrameShadow}
              onToggleGrain={handleGrainToggle}
            />

            {/* Background Selection */}
            <div className="space-y-3">
              <Label id="bg-type-label" className="text-sm font-medium text-muted-foreground">
                Background
              </Label>

              <SegmentedControl
                value={bgType}
                onChange={(value) => setBgType(value === "image" ? "image" : "gradient")}
                options={[
                  { id: "gradient", label: "Gradient" },
                  { id: "image", label: "Image" },
                ]}
                ariaLabel="Background type"
              />

              {bgType === "gradient" && <GradientPicker onChangeAction={handleGradientChange} />}

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

interface EffectsSectionProps {
  showGlass: boolean;
  showCorners: boolean;
  showShadow: boolean;
  glassEnabled: boolean;
  cornersRounded: boolean;
  shadowEnabled: boolean;
  grainEnabled: boolean;
  onToggleGlass: () => void;
  onToggleCorners: () => void;
  onToggleShadow: () => void;
  onToggleGrain: (enabled: boolean) => void;
}

type EffectToggleVariant = "glass" | "corners" | "shadow" | "grain";

interface EffectToggleRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  variant: EffectToggleVariant;
}

interface AssetDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File) => void;
  disabled?: boolean;
  label: string;
  variant?: "default" | "logo";
}

const EffectsSection = ({
  showGlass,
  showCorners,
  showShadow,
  glassEnabled,
  cornersRounded,
  shadowEnabled,
  grainEnabled,
  onToggleGlass,
  onToggleCorners,
  onToggleShadow,
  onToggleGrain,
}: EffectsSectionProps) => {
  return (
    <section aria-label="Effects" className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">Effects</Label>

      <div className="space-y-2">
        {showGlass && (
          <EffectToggleRow
            label="Glass"
            variant="glass"
            checked={glassEnabled}
            onToggle={onToggleGlass}
          />
        )}
        {showCorners && (
          <EffectToggleRow
            label="Corners"
            variant="corners"
            checked={cornersRounded}
            onToggle={onToggleCorners}
          />
        )}
        {showShadow && (
          <EffectToggleRow
            label="Shadow"
            variant="shadow"
            checked={shadowEnabled}
            onToggle={onToggleShadow}
          />
        )}
        <EffectToggleRow
          label="Grain"
          variant="grain"
          checked={grainEnabled}
          onToggle={() => onToggleGrain(!grainEnabled)}
        />
      </div>
    </section>
  );
};

interface EffectToggleVisuals {
  trackClass?: string;
  trackStyle?: CSSProperties;
  knobClass?: string;
  knobStyle?: CSSProperties;
  trackOverlay?: ReactNode;
  knobOverlay?: ReactNode;
}

const EffectToggleRow = ({ label, checked, onToggle, variant }: EffectToggleRowProps) => (
  <EffectToggleControl
    label={label}
    checked={checked}
    onToggle={onToggle}
    variant={variant}
    visuals={getEffectToggleVisuals(variant, checked)}
  />
);

interface EffectToggleControlProps extends EffectToggleRowProps {
  visuals: EffectToggleVisuals;
}

const EffectToggleControl = ({ label, checked, onToggle, variant, visuals }: EffectToggleControlProps) => {
  const isCorners = variant === "corners";

  const trackClasses = cn(
    "relative flex h-7 w-12 items-center overflow-hidden px-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] border border-black/10 dark:border-white/20",
    isCorners && !checked ? "rounded-[8px]" : "rounded-full",
    checked
      ? "bg-[#fcfcfc] dark:bg-white/12"
      : "bg-[#f6f6f6] text-gray-600 dark:bg-white/5",
    visuals.trackClass,
  );

  const knobStyle = {
    ...visuals.knobStyle,
  } satisfies CSSProperties;

  const knobClasses = cn(
    "relative z-[1] h-[18px] w-[18px] transform rounded-full border border-white/70 bg-[#dcdcdc] text-[#111] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/30 dark:bg-white/90",
    checked ? "translate-x-5" : "translate-x-0",
    visuals.knobClass,
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="group flex h-12 w-full items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 text-left text-sm font-medium text-foreground transition-all duration-200 hover:border-border hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/90 dark:hover:border-white/30 dark:hover:bg-white/[0.06]"
    >
      <span>{label}</span>
      <span aria-hidden="true" className={trackClasses} style={visuals.trackStyle}>
        {visuals.trackOverlay}
        <span className={knobClasses} style={knobStyle}>
          {visuals.knobOverlay}
        </span>
      </span>
    </button>
  );
};

function getEffectToggleVisuals(
  variant: EffectToggleVariant,
  isOn: boolean,
): EffectToggleVisuals {
  switch (variant) {
    case "glass":
      return {
        trackOverlay: isOn ? (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-[2px] rounded-full bg-gradient-to-b from-transparent via-black/35 to-black/70 transition-opacity duration-300",
              isOn ? "opacity-60" : "opacity-0",
            )}
          />
        ) : undefined,
        knobStyle: isOn
          ? {
              border: "1px solid rgba(255,255,255,0.65)",
              backdropFilter: "blur(2px)",
              background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(30,30,30,0.12))",
            }
          : {
              border: "1px solid rgba(255,255,255,0.65)",
            },
      };
    case "corners":
      return {
        trackStyle: {
          transitionProperty: "background-color, transform",
        },
        knobClass: isOn ? undefined : "rounded-[5px]",
        knobStyle: {
          transitionProperty: "transform, background-color, box-shadow",
        },
      };
    case "shadow":
      return {
        trackClass: isOn
          ? "shadow-[0_0_18px_rgba(0,0,0,0.35)] dark:shadow-[0_0_18px_rgba(255,255,255,0.35)]"
          : undefined,
      };
    case "grain":
      return {
        trackStyle: isOn
          ? {
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.5) 0.25px, transparent 0.25px), radial-gradient(rgba(45,45,45,0.4) 0.35px, transparent 0.35px)",
              backgroundSize: "1.6px 1.6px, 2.4px 2.4px",
              backgroundBlendMode: "screen, multiply",
              opacity: 0.9,
            }
          : undefined,
        knobOverlay: isOn ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(rgba(0,0,0,0.35)_0.25px,transparent_0.25px)] opacity-25"
          />
        ) : undefined,
      };
    default:
      return {};
  }
}

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
          "relative flex items-center justify-center overflow-hidden rounded border border-border bg-background",
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
