"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  useEffect,
  useCallback,
  type ReactNode,
  type ButtonHTMLAttributes,
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
import { Tooltip } from "@/components/ui/tooltip";
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

            {showOutlineSection && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Outline</Label>
                <div className="flex items-center gap-3">
                  {outlineControls.softGlass && (
                    <Tooltip label="Glass">
                      <ToggleCardButton
                        active={
                          (config.screenshotFrame?.preset ||
                            DEFAULT_SCREENSHOT_TREATMENT.preset) === "soft-glass"
                        }
                        onClick={toggleSoftGlass}
                        aria-label="Toggle soft glass outline"
                        aria-pressed={
                          (config.screenshotFrame?.preset ||
                            DEFAULT_SCREENSHOT_TREATMENT.preset) === "soft-glass"
                        }
                        className="h-12 w-12"
                      >
                        <SoftGlassGlyph
                          active={
                            (config.screenshotFrame?.preset ||
                              DEFAULT_SCREENSHOT_TREATMENT.preset) === "soft-glass"
                          }
                        />
                      </ToggleCardButton>
                    </Tooltip>
                  )}
                  {outlineControls.shape && (
                    <Tooltip label="Corners">
                      <ToggleCardButton
                        active={(config.screenshotFrame?.shape ?? "rounded") === "rounded"}
                        onClick={handleShapeToggle}
                        aria-label="Toggle corner style"
                        aria-pressed={(config.screenshotFrame?.shape ?? "rounded") === "rounded"}
                        className="h-12 w-12"
                      >
                        <CornerGlyph
                          rounded={(config.screenshotFrame?.shape ?? "rounded") === "rounded"}
                        />
                      </ToggleCardButton>
                    </Tooltip>
                  )}
                  {outlineControls.shadow && (
                    <Tooltip label="Shadow">
                      <ToggleCardButton
                        active={config.screenshotFrame?.shadowEnabled ?? true}
                        onClick={toggleFrameShadow}
                        aria-label="Toggle shadow"
                        aria-pressed={config.screenshotFrame?.shadowEnabled ?? true}
                        className="h-12 w-12"
                      >
                        <ShadowGlyph active={config.screenshotFrame?.shadowEnabled ?? true} />
                      </ToggleCardButton>
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
    <ToggleCardButton
      active={enabled}
      onClick={() => onToggle(!enabled)}
      role="switch"
      aria-checked={enabled}
      aria-label="Toggle background grain"
      emphasis="glow"
      showActiveTexture
      className="w-full items-center justify-between gap-3 px-4 py-3 text-left"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">
        Grain
      </span>

      <span
        className={cn(
          "relative rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em]",
          enabled ? "bg-foreground/90 text-background" : "bg-border/80 text-muted-foreground",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-[-2px] rounded-full opacity-0 transition",
            enabled && "opacity-60",
          )}
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.2) 0.6px, transparent 0.6px), radial-gradient(rgba(15,23,42,0.4) 0.8px, transparent 0.8px)",
            backgroundSize: "3px 3px, 6px 6px",
            mixBlendMode: "soft-light",
          }}
        />
        {enabled ? "ON" : "OFF"}
      </span>
    </ToggleCardButton>
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

interface ToggleCardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  emphasis?: "subtle" | "glow";
  showActiveTexture?: boolean;
}

function ToggleCardButton({
  active,
  emphasis = "subtle",
  showActiveTexture = false,
  className,
  children,
  type = "button",
  ...props
}: ToggleCardButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:translate-y-[0.5px]",
        emphasis === "glow"
          ? active
            ? "border-primary/60 bg-gradient-to-b from-background via-primary/5 to-primary/15 text-foreground shadow-[0_12px_32px_rgba(15,23,42,0.25)]"
            : "border-border/70 bg-gradient-to-b from-background via-muted/10 to-muted/30 text-muted-foreground/90 hover:text-foreground"
          : active
            ? "border-primary/60 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        className,
      )}
    >
      {showActiveTexture && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition",
            active && "opacity-60",
          )}
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.25) 0.6px, transparent 0.6px), radial-gradient(rgba(15,23,42,0.35) 0.9px, transparent 0.9px), linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 35%, rgba(0,0,0,0.15) 100%)",
            backgroundSize: "4px 4px, 8px 8px, 100% 100%",
            backgroundBlendMode: "screen, overlay, normal",
          }}
        />
      )}
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
