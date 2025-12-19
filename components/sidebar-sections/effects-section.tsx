"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  useCallback,
  useMemo,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import { track } from "@/lib/analytics";
import { configAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom, screenshotAssetAtom } from "@/hooks/atoms/derived";
import { cn } from "@/utils";
import type { ScreenshotTreatment } from "@/domain/layout/types";
import { resolvePatternChoice } from "@/domain/layout/patterns";

const DEFAULT_SCREENSHOT_TREATMENT: ScreenshotTreatment = {
  preset: "soft-glass" as const,
  canvasMode: "adaptive" as const,
  shadowEnabled: true,
  shape: "rounded" as const,
};

const FULL_OUTLINE_CONTROLS = {
  softGlass: true,
  shape: true,
  shadow: true,
  fade: false,
};

const PATTERN_OPTIONS = ["none", "grain", "organic", "grid"] as const;
type PatternOption = (typeof PATTERN_OPTIONS)[number];

/**
 * Hook for managing pattern selection
 */
function usePatternControls(setConfig: ReturnType<typeof useSetAtom<typeof configAtom>>) {
  const config = useAtomValue(configAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const backgroundType = config.background?.type;
  const isImageBackground = backgroundType === "image";
  const resolvedPattern = resolvePatternChoice(config, screenshotAsset?.colorPalette) as PatternOption;
  const shouldShowStyle = !isImageBackground;

  const handlePatternSelect = useCallback(
    (patternId: PatternOption) => {
      track("pattern_changed", {
        pattern: patternId,
        look_id: config.layoutId,
      });

      setConfig((current) => {
        const background =
          current.background ?? ({
            type: "gradient",
            value: "custom",
          } as typeof current.background);
        return {
          ...current,
          background: {
            ...background,
            patternMode: "manual",
            patternId,
            grainEnabled: patternId !== "none",
          },
        };
      });
    },
    [setConfig, config.layoutId],
  );

  const getPatternLabel = useCallback((id: PatternOption) => {
    return id === "none" ? "Off" : id.charAt(0).toUpperCase() + id.slice(1);
  }, []);

  return { resolvedPattern, shouldShowStyle, handlePatternSelect, getPatternLabel };
}

interface PatternStyleRowProps {
  selectedPattern: PatternOption;
  onSelectPattern: (pattern: PatternOption) => void;
  getPatternLabel: (id: PatternOption) => string;
}

function PatternStyleRow({ selectedPattern, onSelectPattern, getPatternLabel }: PatternStyleRowProps) {
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-left text-sm font-medium text-foreground transition-all duration-200 hover:border-border hover:bg-muted/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/90 dark:hover:border-white/30 dark:hover:bg-white/[0.06]">
      <span>Texture</span>
      <div className="grid grid-cols-4 gap-1.5">
        {PATTERN_OPTIONS.map((pattern) => (
          <button
            key={pattern}
            type="button"
            onClick={() => onSelectPattern(pattern)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
              selectedPattern === pattern
                ? "bg-foreground text-background"
                : "border border-border/40 bg-white text-foreground/70 hover:border-border/60 hover:bg-muted/80 hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white/90"
            )}
          >
            {getPatternLabel(pattern)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EffectsSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const screenshot = useAtomValue(screenshotAssetAtom);
  const outlineControls = lookCapabilities?.outline ?? FULL_OUTLINE_CONTROLS;
  const { resolvedPattern, shouldShowStyle, handlePatternSelect, getPatternLabel } =
    usePatternControls(setConfig);

  const shouldAutoEnableFade = useMemo(() => {
    const isBackdropLayout = config.layoutId === "adaptive-stage" || config.layoutId === "full-visual";
    if (!isBackdropLayout || !screenshot?.metadata) return false;

    const { height, aspectRatio } = screenshot.metadata;
    // Enable fade for tall vertical images (height > 720px and aspect ratio < 1)
    return height > 720 && aspectRatio < 1;
  }, [config.layoutId, screenshot?.metadata]);

  // Get look-specific fade state
  const layoutSpecificFadeEnabled = config.layoutSpecificSettings?.fadeEnabled?.[config.layoutId];
  const currentFadeState = layoutSpecificFadeEnabled ?? shouldAutoEnableFade;

  const toggleSoftGlass = useCallback(() => {
    setConfig((currentConfig) => {
      const treatment = currentConfig.screenshotFrame ?? DEFAULT_SCREENSHOT_TREATMENT;
      const isSoftGlass = treatment.preset === "soft-glass";
      const newPreset = isSoftGlass ? "solid" : "soft-glass";
      track("effect_toggled", {
        effect: "soft_glass",
        enabled: !isSoftGlass,
      });
      return {
        ...currentConfig,
        screenshotFrame: {
          ...treatment,
          preset: newPreset,
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
      track("effect_toggled", {
        effect: "rounded_corners",
        enabled: nextShape === "rounded",
      });
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
      const newShadowEnabled = !(treatment.shadowEnabled ?? true);
      track("effect_toggled", {
        effect: "shadow",
        enabled: newShadowEnabled,
      });
      return {
        ...currentConfig,
        screenshotFrame: {
          ...treatment,
          shadowEnabled: newShadowEnabled,
        },
      };
    });
  }, [setConfig]);

  const toggleFade = useCallback(() => {
    setConfig((currentConfig) => {
      const layoutSpecificFadeEnabled =
        currentConfig.layoutSpecificSettings?.fadeEnabled?.[currentConfig.layoutId];
      const isBackdropLayout =
        currentConfig.layoutId === "adaptive-stage" || currentConfig.layoutId === "full-visual";
      const autoEnableFade =
        isBackdropLayout && screenshot?.metadata
          ? screenshot.metadata.height > 720 && screenshot.metadata.aspectRatio < 1
          : false;
      const currentState = layoutSpecificFadeEnabled ?? autoEnableFade;

      return {
        ...currentConfig,
        layoutSpecificSettings: {
          ...currentConfig.layoutSpecificSettings,
          fadeEnabled: {
            ...currentConfig.layoutSpecificSettings?.fadeEnabled,
            [currentConfig.layoutId]: !currentState,
          },
        },
      };
    });
  }, [setConfig, screenshot]);

  const showOutlineSection =
    outlineControls.softGlass ||
    outlineControls.shape ||
    outlineControls.shadow ||
    outlineControls.fade;

  if (!showOutlineSection) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        This look doesn&apos;t have configurable effects
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-2">
      {outlineControls.softGlass && (
        <EffectToggleRow
          label="Soft Glass"
          variant="glass"
          checked={
            (config.screenshotFrame?.preset || DEFAULT_SCREENSHOT_TREATMENT.preset) === "soft-glass"
          }
          onToggle={toggleSoftGlass}
        />
      )}
      {outlineControls.shape && (
        <EffectToggleRow
          label="Corners"
          variant="corners"
          checked={(config.screenshotFrame?.shape ?? "rounded") === "rounded"}
          onToggle={handleShapeToggle}
        />
      )}
      {outlineControls.shadow && (
        <EffectToggleRow
          label="Shadow"
          variant="shadow"
          checked={config.screenshotFrame?.shadowEnabled ?? true}
          onToggle={toggleFrameShadow}
        />
      )}
      {outlineControls.fade && (
        <EffectToggleRow
          label="Fade"
          variant="fade"
          checked={currentFadeState}
          onToggle={toggleFade}
        />
      )}

      {/* Pattern Style Controls - Only show for gradient backgrounds */}
      {shouldShowStyle && (
        <PatternStyleRow
          selectedPattern={resolvedPattern}
          onSelectPattern={handlePatternSelect}
          getPatternLabel={getPatternLabel}
        />
      )}
    </div>
  );
}

type EffectToggleVariant = "glass" | "corners" | "shadow" | "fade";

interface EffectToggleRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  variant: EffectToggleVariant;
}

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

function EffectToggleRow({ label, checked, onToggle, variant }: EffectToggleRowProps) {
  return (
    <EffectToggleControl
      label={label}
      checked={checked}
      onToggle={onToggle}
      variant={variant}
      visuals={getEffectToggleVisuals(variant, checked)}
    />
  );
}

interface EffectToggleControlProps extends EffectToggleRowProps {
  visuals: EffectToggleVisuals;
}

function EffectToggleControl({
  label,
  checked,
  onToggle,
  variant,
  visuals,
}: EffectToggleControlProps) {
  const isCorners = variant === "corners";
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for client-side mount
  useLayoutEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Use resolvedTheme after mount, default to light during SSR
  const themeMode: ThemeMode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const themeVisuals = visuals[themeMode] ?? {};

  const trackClasses = cn(
    "relative flex h-7 w-12 items-center overflow-hidden px-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] border border-black/10 dark:border-white/20",
    isCorners && !checked ? "rounded-[8px]" : "rounded-full",
    checked ? "bg-[#fcfcfc] dark:bg-[#1f1f1f]" : "bg-[#f6f6f6] text-gray-600 dark:bg-[#131313]",
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
}

function getEffectToggleVisuals(variant: EffectToggleVariant, isOn: boolean): EffectToggleVisuals {
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
            className="pointer-events-none absolute inset-1 rounded-full bg-white/40 opacity-70 mix-blend-screen blur-md"
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
            className="pointer-events-none absolute inset-1 rounded-full bg-white/20 opacity-60 mix-blend-screen blur-md"
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
    case "fade":
      if (!isOn) {
        return createSharedVisuals();
      }
      return createThemedVisuals(
        {
          trackClass: "bg-gradient-to-b from-slate-600 to-slate-300",
        },
        {
          trackClass: "bg-gradient-to-b from-slate-400 to-slate-600",
        },
      );
    default:
      return createSharedVisuals();
  }
}
