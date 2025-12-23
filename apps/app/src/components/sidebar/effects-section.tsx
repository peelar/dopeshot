"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { track } from "@/lib/analytics";
import { configAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom, screenshotAssetAtom } from "@/hooks/atoms/derived";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  fade: false,
};

const PATTERN_OPTIONS = ["none", "grain", "grid"] as const;
type PatternOption = (typeof PATTERN_OPTIONS)[number];

/**
 * Hook for managing pattern selection
 */
function usePatternControls(setConfig: ReturnType<typeof useSetAtom<typeof configAtom>>) {
  const config = useAtomValue(configAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const resolvedPattern = resolvePatternChoice(config, screenshotAsset?.colorPalette) as PatternOption;

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
            grainEnabled: patternId === "grain",
          },
        };
      });
    },
    [setConfig, config.layoutId],
  );

  const getPatternLabel = useCallback((id: PatternOption) => {
    return id === "none" ? "Off" : id.charAt(0).toUpperCase() + id.slice(1);
  }, []);

  return { resolvedPattern, handlePatternSelect, getPatternLabel };
}

interface PatternStyleRowProps {
  selectedPattern: PatternOption;
  onSelectPattern: (pattern: PatternOption) => void;
  getPatternLabel: (id: PatternOption) => string;
}

function PatternStyleRow({ selectedPattern, onSelectPattern, getPatternLabel }: PatternStyleRowProps) {
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-left text-sm font-medium text-foreground transition-all duration-200 hover:border-border hover:bg-muted/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/90 dark:hover:border-white/30 dark:hover:bg-white/[0.06]">
      <span>Texture</span>
      <div className="grid grid-cols-4 gap-1.5">
        {PATTERN_OPTIONS.map((pattern) => (
          <Button
            key={pattern}
            type="button"
            onClick={() => onSelectPattern(pattern)}
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
              selectedPattern === pattern
                ? "bg-foreground text-background"
                : "border border-border/40 bg-white text-foreground/70 hover:border-border/60 hover:bg-muted/80 hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white/90"
            )}
          >
            {getPatternLabel(pattern)}
          </Button>
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
  const { resolvedPattern, handlePatternSelect, getPatternLabel } = usePatternControls(setConfig);

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
          checked={
            (config.screenshotFrame?.preset || DEFAULT_SCREENSHOT_TREATMENT.preset) === "soft-glass"
          }
          onToggle={toggleSoftGlass}
        />
      )}
      {outlineControls.shape && (
        <EffectToggleRow
          label="Corners"
          checked={(config.screenshotFrame?.shape ?? "rounded") === "rounded"}
          onToggle={handleShapeToggle}
        />
      )}
      {outlineControls.fade && (
        <EffectToggleRow
          label="Fade"
          checked={currentFadeState}
          onToggle={toggleFade}
        />
      )}

      <PatternStyleRow
        selectedPattern={resolvedPattern}
        onSelectPattern={handlePatternSelect}
        getPatternLabel={getPatternLabel}
      />
    </div>
  );
}

interface EffectToggleRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

function EffectToggleRow({ label, checked, onToggle }: EffectToggleRowProps) {
  return (
    <div className="flex h-12 w-full items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 text-left text-sm font-medium text-foreground">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
