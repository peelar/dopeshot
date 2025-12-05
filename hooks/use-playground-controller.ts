"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useTheme } from "next-themes";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";
import { getPreferredGradientAngle } from "@/domain/layout/gradient-application";
import { getRandomDemoPreset } from "@/domain/demo/presets";
import { getLookById, type Look } from "@/domain/look/looks";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { exportLayoutAsPng } from "@/domain/layout/export";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
import { PLACEHOLDER_ASSET_ID } from "@/hooks/atoms";
import {
  assetsAtom,
  configAtom,
  hasCustomScreenshotAtom,
  isAnalyzingColorsAtom,
  isExportingAtom,
  statusMessageAtom,
} from "@/hooks/atoms";
import {
  canvasAtom,
  currentLookAtom,
  isAspectLockedAtom,
  isScreenshotFocusedModeAtom,
  screenshotAssetAtom,
  shouldShowAspectLockAtom,
  lookCapabilitiesAtom,
} from "@/hooks/atoms/derived";
import { useColorAnalysis } from "@/hooks/use-color-analysis";
import { useDragAndUpload } from "@/hooks/use-drag-and-upload";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useFocusHint } from "@/hooks/use-focus-hint";
import { useMobileDetection } from "@/hooks/use-mobile-detection";

interface ExportContext {
  hasScreenshot: boolean;
  setStatusMessage: Setter<string>;
  setIsExporting: Setter<boolean>;
  config: LayoutConfig;
  currentLook: Look | undefined;
  canvas: { width: number; height: number };
  screenshotAsset: Asset | undefined;
}

type Setter<T> = (value: T | ((prev: T) => T)) => void;

export function usePlaygroundController() {
  const { theme } = useTheme();
  const isMobile = useMobileDetection();

  const [config, setConfig] = useAtom(configAtom);
  const [assets, setAssets] = useAtom(assetsAtom);
  const statusMessage = useAtomValue(statusMessageAtom);
  const [isExporting, setIsExporting] = useAtom(isExportingAtom);
  const hasCustomScreenshot = useAtomValue(hasCustomScreenshotAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);
  const currentLook = useAtomValue(currentLookAtom);
  const lookCapabilities = useAtomValue(lookCapabilitiesAtom);
  const canvas = useAtomValue(canvasAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const isScreenshotFocusedMode = useAtomValue(isScreenshotFocusedModeAtom);
  const shouldShowAspectLock = useAtomValue(shouldShowAspectLockAtom);
  const isAspectLocked = useAtomValue(isAspectLockedAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);
  const [hasAppliedRandomPreset, setHasAppliedRandomPreset] = useState(false);

  useDemoPreset({
    hasAppliedRandomPreset,
    hasCustomScreenshot,
    setAssets,
    setConfig,
    setHasAppliedRandomPreset,
  });

  const { isConfigDrawerOpen, setIsConfigDrawerOpen } = useConfigDrawer(isMobile);

  const gradientPreferences = useGradientPreferences(config, theme);

  const { processColorAnalysis } = useColorAnalysis({ gradientPreferences });
  const { handleFileProcess, isProcessingUpload } = useFileUpload({ processColorAnalysis });

  usePlaceholderGradientBootstrap({ assets, config, processColorAnalysis });

  const showFocusHint = useFocusHint(isScreenshotFocusedMode, lookCapabilities?.focusMode);
  const hasScreenshot = Boolean(config.assets.screenshot);

  const handleExport = useExportHandler({
    hasScreenshot,
    setStatusMessage,
    setIsExporting,
    config,
    currentLook,
    canvas,
    screenshotAsset,
  });

  const handleVariantChange = useVariantChangeHandler(setConfig);
  const toggleCanvasMode = useCanvasModeToggle(setConfig);

  const handleScreenshotUpload = useCallback(
    async (file?: File) => {
      if (!file) return;
      await handleFileProcess(file, "screenshot");
    },
    [handleFileProcess],
  );

  const dragAndUpload = useDragAndUpload({
    onFileUpload: handleScreenshotUpload,
    isProcessingUpload,
  });

  return {
    isMobile,
    statusMessage,
    hasCustomScreenshot,
    isProcessingUpload,
    isAnalyzingColors,
    showFocusHint,
    hasScreenshot,
    isExporting,
    shouldShowAspectLock,
    isAspectLocked,
    canvas,
    handleVariantChange,
    toggleCanvasMode,
    handleExport,
    handleFileProcess,
    isConfigDrawerOpen,
    setIsConfigDrawerOpen,
    dragAndUpload,
  };
}

function useDemoPreset({
  hasAppliedRandomPreset,
  hasCustomScreenshot,
  setAssets,
  setConfig,
  setHasAppliedRandomPreset,
}: {
  hasAppliedRandomPreset: boolean;
  hasCustomScreenshot: boolean;
  setAssets: Setter<Asset[]>;
  setConfig: Setter<LayoutConfig>;
  setHasAppliedRandomPreset: Setter<boolean>;
}) {
  useEffect(() => {
    if (hasAppliedRandomPreset || hasCustomScreenshot) return;

    const randomPreset = getRandomDemoPreset();
    setConfig(randomPreset.config);
    setAssets([randomPreset.asset]);
    setHasAppliedRandomPreset(true);
  }, [hasAppliedRandomPreset, hasCustomScreenshot, setAssets, setConfig, setHasAppliedRandomPreset]);
}

function useConfigDrawer(isMobile: boolean) {
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isMobile && isConfigDrawerOpen) {
      setIsConfigDrawerOpen(false);
    }
  }, [isConfigDrawerOpen, isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    const previousOverflow = document.body.style.overflow;
    if (isConfigDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isConfigDrawerOpen, isMobile]);

  return { isConfigDrawerOpen, setIsConfigDrawerOpen };
}

function useGradientPreferences(config: LayoutConfig, theme?: string | null) {
  return useMemo<GradientPreferences>(() => {
    return {
      angle: getPreferredGradientAngle(config),
      temperature: theme === "dark" ? "cool" : "warm",
      intensity: isScreenshotFocused(config) ? "bold" : "balanced",
    };
  }, [config, theme]);
}

function usePlaceholderGradientBootstrap({
  assets,
  config,
  processColorAnalysis,
}: {
  assets: Asset[];
  config: LayoutConfig;
  processColorAnalysis: (url: string, id: string, gradientId: string | null) => Promise<void>;
}) {
  useEffect(() => {
    const placeholderAsset = assets.find((asset) => asset.id === PLACEHOLDER_ASSET_ID);
    const hasGradientSet = config.background?.customGradient !== undefined;
    const usingCustomGradientSlot =
      config.background?.type === "gradient" && config.background?.value === "custom";

    if (!placeholderAsset || hasGradientSet || !usingCustomGradientSlot) {
      return;
    }

    void processColorAnalysis(placeholderAsset.url, placeholderAsset.id, null);
  }, [
    assets,
    config.background?.customGradient,
    config.background?.type,
    config.background?.value,
    processColorAnalysis,
  ]);
}

function useExportHandler({
  hasScreenshot,
  setStatusMessage,
  setIsExporting,
  config,
  currentLook,
  canvas,
  screenshotAsset,
}: ExportContext) {
  return useCallback(async () => {
    if (!hasScreenshot) {
      setStatusMessage("Please upload a screenshot before exporting.");
      return;
    }

    track("export_button_clicked", {
      look_id: config.lookId,
      look_name: currentLook?.name ?? "unknown",
      variant: config.variant,
      background_type: config.background?.type ?? "unknown",
      font_id: config.fontId,
    });
    setIsExporting(true);
    setStatusMessage("Exporting image...");
    try {
      const maxImageScale =
        screenshotAsset?.metadata?.width && screenshotAsset?.metadata?.height
          ? Math.min(
              screenshotAsset.metadata.width / canvas.width,
              screenshotAsset.metadata.height / canvas.height,
            )
          : undefined;

      await exportLayoutAsPng("export-container", "cover-image.png", {
        width: canvas.width,
        height: canvas.height,
        maxImageScale,
      });
      setStatusMessage("Image exported successfully.");
    } catch (error) {
      console.error("Export Error Handler:", error);
      const msg = error instanceof Error ? error.message : "Unknown error occurred";
      setStatusMessage(`Export failed: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  }, [
    canvas.height,
    canvas.width,
    config.background?.type,
    config.fontId,
    config.lookId,
    config.variant,
    currentLook?.name,
    hasScreenshot,
    screenshotAsset?.metadata?.height,
    screenshotAsset?.metadata?.width,
    setIsExporting,
    setStatusMessage,
  ]);
}

function useVariantChangeHandler(setConfig: Setter<LayoutConfig>) {
  return useCallback(
    (variant: string) => {
      setConfig((currentConfig) => {
        const look = getLookById(currentConfig.lookId);
        if (!look || !look.variants.includes(variant) || currentConfig.variant === variant) {
          return currentConfig;
        }

        return {
          ...currentConfig,
          variant,
        };
      });
    },
    [setConfig],
  );
}

function useCanvasModeToggle(setConfig: Setter<LayoutConfig>) {
  return useCallback(() => {
    setConfig((currentConfig) => {
      const treatment = getScreenshotTreatment(currentConfig);

      return {
        ...currentConfig,
        screenshotFrame: {
          ...treatment,
          canvasMode: treatment.canvasMode === "locked" ? "adaptive" : "locked",
          lockedAspectRatio: treatment.lockedAspectRatio ?? DEFAULT_LOCKED_ASPECT_RATIO,
        },
      };
    });
  }, [setConfig]);
}
