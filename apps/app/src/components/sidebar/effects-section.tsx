"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { configAtom, previewModeAtom } from "@/hooks/atoms";
import { layoutCapabilitiesAtom, screenshotAssetAtom } from "@/hooks/atoms/derived";
import { supportsVideo } from "@/domain/layout-def/definitions";
import { Switch } from "@/components/ui/switch";
import { track } from "@/lib/analytics";
import type { ScreenshotTreatment } from "@/domain/layout/types";
import { inferFadeDirection } from "@/domain/layout/fade-direction";

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
  const previewMode = useAtomValue(previewModeAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const outlineControls = lookCapabilities?.outline ?? FULL_OUTLINE_CONTROLS;

  const isVideoMode = previewMode === "video";
  const layoutHasVideo = supportsVideo(config.layoutId);

  // Fade is disabled by default, only enabled if explicitly set by user
  const layoutSpecificFadeEnabled = config.layoutSpecificSettings?.fadeEnabled?.[config.layoutId];
  const layoutSpecificFadeDirection =
    config.layoutSpecificSettings?.fadeDirection?.[config.layoutId];
  const currentFadeState = layoutSpecificFadeEnabled ?? false;

  // Typing animation (video mode only)
  const currentTypingState = config.layoutSpecificSettings?.typingEnabled?.[config.layoutId] ?? false;

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

      const inferredDirection = inferFadeDirection(currentConfig);

      return {
        ...currentConfig,
        layoutSpecificSettings: {
          ...currentConfig.layoutSpecificSettings,
          fadeEnabled: {
            ...currentConfig.layoutSpecificSettings?.fadeEnabled,
            [currentConfig.layoutId]: !currentState,
          },
          fadeDirection: {
            ...currentConfig.layoutSpecificSettings?.fadeDirection,
            ...(currentState
              ? {}
              : { [currentConfig.layoutId]: layoutSpecificFadeDirection ?? inferredDirection }),
          },
        },
      };
    });
  }, [setConfig, layoutSpecificFadeDirection]);

  const toggleTyping = useCallback(() => {
    setConfig((currentConfig) => {
      const currentState =
        currentConfig.layoutSpecificSettings?.typingEnabled?.[currentConfig.layoutId] ?? false;

      track("video_typing_toggled", { enabled: !currentState, layout_id: currentConfig.layoutId });

      return {
        ...currentConfig,
        layoutSpecificSettings: {
          ...currentConfig.layoutSpecificSettings,
          typingEnabled: {
            ...currentConfig.layoutSpecificSettings?.typingEnabled,
            [currentConfig.layoutId]: !currentState,
          },
        },
      };
    });
  }, [setConfig]);

  const showTypingToggle = isVideoMode && layoutHasVideo;

  const showOutlineSection =
    outlineControls.softGlass ||
    outlineControls.fade ||
    showTypingToggle;

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

      {showTypingToggle && (
        <EffectToggleRow
          label="Typewriter"
          checked={currentTypingState}
          onToggle={toggleTyping}
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
