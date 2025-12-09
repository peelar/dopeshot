"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useTheme } from "next-themes";
import {
  BackgroundConfig,
  ColorToken,
  FontId,
  FontSize,
  ScreenshotTreatment,
} from "@/domain/layout/types";
import { Label } from "@/components/ui/label";
import { Asset } from "@/domain/asset/types";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/utils";
import { GradientPicker } from "@/components/gradient-picker";
import { FontSelector } from "@/components/font-selector";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DEFAULT_LOCKED_ASPECT_RATIO } from "@/domain/layout/screenshot-mode";
import { configAtom } from "@/hooks/atoms";
import {
  lookCapabilitiesAtom,
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
  const lookCapabilities = useAtomValue(lookCapabilitiesAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const logoAsset = useAtomValue(logoAssetAtom);
  const backgroundAsset = useAtomValue(backgroundAssetAtom);
  const outlineControls = lookCapabilities?.outline ?? FULL_OUTLINE_CONTROLS;
  const showHeadlineInput = (lookCapabilities?.text.headline ?? "optional") !== "hidden";
  const showSubtitleInput = (lookCapabilities?.text.subtitle ?? "optional") !== "hidden";
  const showTypographyControls = lookCapabilities?.typography !== false;
  const showOutlineSection =
    outlineControls.softGlass || outlineControls.shape || outlineControls.shadow;
  const showLogoUpload = lookCapabilities?.logo !== "hidden";

  // Local state for background tab selection (default to current config type or gradient)
  const [bgType, setBgType] = useState<"gradient" | "image">(
    config.background?.type === "image" ? "image" : "gradient",
  );

  // Sync local state with config type when it changes externally (e.g. look switch)
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
        const currentBackground =
          currentConfig.background ?? ({ type: "gradient", value: "custom" } as BackgroundConfig);
        const grainEnabled = background.grainEnabled ?? currentBackground.grainEnabled ?? true;
        return {
          ...currentConfig,
          colors: {
            ...currentConfig.colors,
            text: textColor,
          },
          background: {
            ...currentBackground,
            ...background,
            grainEnabled,
            patternId: background.patternId ?? currentBackground.patternId,
            patternMode: background.patternMode ?? currentBackground.patternMode,
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

  const handleRemoveLogo = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      assets: {
        ...currentConfig.assets,
        logo: undefined,
      },
    }));
  }, [setConfig]);

  const handleRemoveScreenshot = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      assets: {
        ...currentConfig.assets,
        screenshot: undefined,
      },
    }));
  }, [setConfig]);

  const handleRemoveBackground = useCallback(() => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      assets: {
        ...currentConfig.assets,
        background: undefined,
      },
    }));
  }, [setConfig]);

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
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-4">
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
            className="flex flex-col gap-3"
          >
            {(showHeadlineInput || showSubtitleInput) && (
              <div className="flex flex-col gap-3">
                {showHeadlineInput && (
                  <div className="flex flex-col gap-3">
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
                  <div className="flex flex-col gap-3">
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
              <div className="flex flex-col gap-3">
                <SidebarFieldLabel htmlFor="sidebar-typography">Typography</SidebarFieldLabel>
                <FontSelector
                  fontId={config.fontId}
                  fontSize={config.fontSize}
                  onFontChangeAction={handleFontChange}
                  onSizeChangeAction={handleFontSizeChange}
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <SidebarFieldLabel htmlFor="effects-section">Effects</SidebarFieldLabel>
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
                onToggleGlass={toggleSoftGlass}
                onToggleCorners={handleShapeToggle}
                onToggleShadow={toggleFrameShadow}
              />
            </div>

            <div className="flex flex-col gap-3">
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
                <div className="flex flex-col gap-3">
                  <AssetDropzone
                    asset={backgroundAsset}
                    onUpload={(file) => onUploadAsset?.(file, "background")}
                    onRemove={handleRemoveBackground}
                    disabled={!onUploadAsset}
                    label="Upload Background"
                  />
                </div>
              )}

              {/* Pattern selection lives in the top Style row now */}
            </div>
          </div>
        )}

        {activeTab === "assets" && (
          <div
            role="tabpanel"
            id="tabpanel-assets"
            aria-labelledby="tab-assets"
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-3">
              <Label className="text-xs text-muted-foreground">Screenshot</Label>
              <AssetDropzone
                asset={screenshotAsset}
                onUpload={(file) => onUploadAsset?.(file, "screenshot")}
                onRemove={handleRemoveScreenshot}
                disabled={!onUploadAsset}
                label="Upload Screenshot"
              />
            </div>

            {showLogoUpload && (
              <div className="flex flex-col gap-3">
                <Label className="text-xs text-muted-foreground">Logo</Label>
                <AssetDropzone
                  asset={logoAsset}
                  onUpload={(file) => onUploadAsset?.(file, "logo")}
                  onRemove={handleRemoveLogo}
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
  onToggleGlass: () => void;
  onToggleCorners: () => void;
  onToggleShadow: () => void;
}

type EffectToggleVariant = "glass" | "corners" | "shadow";

interface EffectToggleRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  variant: EffectToggleVariant;
}

interface AssetDropzoneProps {
  asset?: Asset;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
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
  onToggleGlass,
  onToggleCorners,
  onToggleShadow,
}: EffectsSectionProps) => {
  return (
    <section aria-label="Effects" className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
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
      </div>
    </section>
  );
};

type ThemeMode = "light" | "dark";

interface EffectToggleVisualState {
  trackClass?: string;
  trackStyle?: CSSProperties;
  knobClass?: string;
  knobStyle?: CSSProperties;
  trackOverlay?: ReactNode;
  knobOverlay?: ReactNode;
}

type EffectToggleVisuals = Record<ThemeMode, EffectToggleVisualState>;

const createSharedVisuals = (visual: EffectToggleVisualState = {}): EffectToggleVisuals => ({
  light: visual,
  dark: visual,
});

const createThemedVisuals = (
  light: EffectToggleVisualState,
  dark: EffectToggleVisualState,
): EffectToggleVisuals => ({
  light,
  dark,
});

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use light theme during SSR to avoid hydration mismatch
  const themeMode: ThemeMode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const themeVisuals = visuals[themeMode] ?? {};

  const trackClasses = cn(
    "relative flex h-7 w-12 items-center overflow-hidden px-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] border border-black/10 dark:border-white/20",
    isCorners && !checked ? "rounded-[8px]" : "rounded-full",
    checked
      ? "bg-[#fcfcfc] dark:bg-[#1f1f1f]"
      : "bg-[#f6f6f6] text-gray-600 dark:bg-[#131313]",
    themeVisuals.trackClass,
  );

  const knobStyle = {
    ...themeVisuals.knobStyle,
  } satisfies CSSProperties;

  const knobClasses = cn(
    "relative z-[1] h-[18px] w-[18px] transform rounded-full border border-white/70 bg-[#dcdcdc] text-[#111] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/30 dark:bg-white/90",
    checked ? "translate-x-5" : "translate-x-0",
    themeVisuals.knobClass,
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="group flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 text-left text-sm font-medium text-foreground transition-all duration-200 hover:border-border hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/90 dark:hover:border-white/30 dark:hover:bg-white/[0.06]"
    >
      <span>{label}</span>
      <span aria-hidden="true" className={trackClasses} style={themeVisuals.trackStyle}>
        {themeVisuals.trackOverlay}
        <span className={knobClasses} style={knobStyle}>
          {themeVisuals.knobOverlay}
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
    case "glass": {
      const offVisual = createSharedVisuals({
        knobStyle: {
          border: "1px solid rgba(255,255,255,0.65)",
        },
      });

      if (!isOn) {
        return offVisual;
      }

      const knobEnhancement: EffectToggleVisualState = {
        knobStyle: {
          border: "1px solid rgba(255,255,255,0.65)",
          backdropFilter: "blur(2px)",
          background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(30,30,30,0.12))",
        },
      };

      const lightOverlay = (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[2px] rounded-full bg-gradient-to-b from-transparent via-white/50 to-white/30 opacity-80"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-1 rounded-full bg-white/40 blur-md mix-blend-screen opacity-70"
          />
        </>
      );

      const darkOverlay = (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[2px] rounded-full bg-gradient-to-b from-transparent via-white/20 to-white/10 opacity-70"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-1 rounded-full bg-white/20 blur-md mix-blend-screen opacity-60"
          />
        </>
      );

      return createThemedVisuals(
        {
          trackClass: "bg-gradient-to-br from-white/85 via-white/60 to-white/25 backdrop-blur",
          trackStyle: {
            backgroundColor: "rgba(255,255,255,0.35)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
            WebkitBackdropFilter: "blur(8px)",
            backdropFilter: "blur(8px)",
          },
          trackOverlay: lightOverlay,
          ...knobEnhancement,
        },
        {
          trackClass: "bg-gradient-to-br from-white/25 via-white/15 to-white/5 backdrop-blur",
          trackStyle: {
            backgroundColor: "rgba(255,255,255,0.15)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
            WebkitBackdropFilter: "blur(10px)",
            backdropFilter: "blur(10px)",
          },
          trackOverlay: darkOverlay,
          ...knobEnhancement,
        },
      );
    }
    case "corners":
      return createSharedVisuals({
        trackStyle: {
          transitionProperty: "background-color, transform",
        },
        knobClass: isOn ? undefined : "rounded-[5px]",
        knobStyle: {
          transitionProperty: "transform, background-color, box-shadow",
        },
      });
    case "shadow":
      if (!isOn) {
        return createSharedVisuals();
      }
      return createThemedVisuals(
        {
          trackClass: "shadow-[0_0_18px_rgba(0,0,0,0.35)]",
        },
        {
          trackClass: "ring-1 ring-white/15 shadow-[0_0_18px_rgba(255,255,255,0.35)]",
        },
      );
    default:
      return createSharedVisuals();
  }
}

const AssetDropzone = ({
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
          <>
            <img
              src={asset.url}
              alt={`Preview of ${asset.name}`}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
            {asset && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Remove asset"
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4 text-white" aria-hidden="true" />
              </button>
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
            "font-semibold text-foreground truncate",
            variant === "logo" ? "text-sm" : "text-xs",
          )}
          title={asset?.name ?? label}
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
