"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, type CSSProperties, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { configAtom } from "@/hooks/atoms";
import { lookCapabilitiesAtom } from "@/hooks/atoms/derived";
import { cn } from "@/utils";
import type { ScreenshotTreatment } from "@/domain/layout/types";

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
};

export function EffectsSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const lookCapabilities = useAtomValue(lookCapabilitiesAtom);
  const outlineControls = lookCapabilities?.outline ?? FULL_OUTLINE_CONTROLS;

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

  const showOutlineSection =
    outlineControls.softGlass || outlineControls.shape || outlineControls.shadow;

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
    </div>
  );
}

type EffectToggleVariant = "glass" | "corners" | "shadow";

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

  // Use resolvedTheme directly - it's already handled by next-themes
  const themeMode: ThemeMode = resolvedTheme === "dark" ? "dark" : "light";
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
    default:
      return createSharedVisuals();
  }
}
