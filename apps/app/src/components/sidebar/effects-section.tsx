"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { configAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom, screenshotAssetAtom } from "@/hooks/atoms/derived";
import { Switch } from "@/components/ui/switch";
import type { ScreenshotTreatment } from "@/domain/layout/types";

const DEFAULT_SCREENSHOT_TREATMENT: ScreenshotTreatment = {
  preset: "soft-glass" as const,
  canvasMode: "adaptive" as const,
  shadowEnabled: true,
  shape: "rounded" as const,
};

const FULL_OUTLINE_CONTROLS = {
  softGlass: true,
  fade: false,
};

export function EffectsSection() {
  const config = useAtomValue(configAtom);
  const setConfig = useSetAtom(configAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const outlineControls = lookCapabilities?.outline ?? FULL_OUTLINE_CONTROLS;

  // Fade is disabled by default, only enabled if explicitly set by user
  const layoutSpecificFadeEnabled = config.layoutSpecificSettings?.fadeEnabled?.[config.layoutId];
  const currentFadeState = layoutSpecificFadeEnabled ?? false;

  const toggleSoftGlass = useCallback(() => {
    setConfig((currentConfig) => {
      const treatment = currentConfig.screenshotFrame ?? DEFAULT_SCREENSHOT_TREATMENT;
      const isSoftGlass = treatment.preset === "soft-glass";
      const newPreset = isSoftGlass ? "solid" : "soft-glass";
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



  const toggleFade = useCallback(() => {
    setConfig((currentConfig) => {
      const layoutSpecificFadeEnabled =
        currentConfig.layoutSpecificSettings?.fadeEnabled?.[currentConfig.layoutId];
      const currentState = layoutSpecificFadeEnabled ?? false;

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
  }, [setConfig]);

  const showOutlineSection =
    outlineControls.softGlass ||
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

      {outlineControls.fade && (
        <EffectToggleRow
          label="Fade"
          checked={currentFadeState}
          onToggle={toggleFade}
        />
      )}
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