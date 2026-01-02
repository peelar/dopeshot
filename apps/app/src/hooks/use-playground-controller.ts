"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useTheme } from "next-themes";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  EXPORT_ORIENTATION_DIMENSIONS,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";
import { getPreferredGradientAngle } from "@/domain/layout/gradient-application";
import { getRandomDemoPreset } from "@/domain/demo/presets";
import type { LayoutDefinition } from "@/domain/layout-def/definitions";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { exportLayoutAsPng, exportLayoutAsPngWithBlob } from "@/domain/layout/export";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
import {
  PLACEHOLDER_ASSET_ID,
  assetsAtom,
  configAtom,
  hasCustomScreenshotAtom,
  isAnalyzingColorsAtom,
  isExportingAtom,
  orientationAtom,
  statusMessageAtom,
  hasExportedAtom,
  currentExportBlobAtom,
} from "@/hooks/atoms";
import {
  canvasAtom,
  currentLayoutAtom,
  isAspectLockedAtom,
  isScreenshotFocusedModeAtom,
  screenshotAssetAtom,
  shouldShowAspectLockAtom,
  layoutCapabilitiesAtom,
} from "@/hooks/atoms/derived";
import { useColorAnalysis } from "@/hooks/use-color-analysis";
import { useDragAndUpload } from "@/hooks/use-drag-and-upload";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useFocusHint } from "@/hooks/use-focus-hint";
import { useMobileDetection } from "@/hooks/use-mobile-detection";

interface ExportContext {
  hasScreenshot: boolean;
  requiresScreenshot: boolean;
  setStatusMessage: Setter<string>;
  setIsExporting: Setter<boolean>;
  config: LayoutConfig;
  currentLook: LayoutDefinition | undefined;
  canvas: { width: number; height: number };
  screenshotAsset: Asset | undefined;
  orientation: "mobile" | "desktop";
  setHasExported: Setter<boolean>;
  setCurrentExportBlob: Setter<Blob | null>;
}

type Setter<T> = (value: T | ((prev: T) => T)) => void;

export function usePlaygroundController() {
  const { theme } = useTheme();
  const isMobile = useMobileDetection();

  const [config, setConfig] = useAtom(configAtom);
  const [assets, setAssets] = useAtom(assetsAtom);
  const orientation = useAtomValue(orientationAtom);
  const statusMessage = useAtomValue(statusMessageAtom);
  const [isExporting, setIsExporting] = useAtom(isExportingAtom);
  const hasCustomScreenshot = useAtomValue(hasCustomScreenshotAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);
  const currentLook = useAtomValue(currentLayoutAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
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

  // Export state atoms for voluntary save
  const setHasExported = useSetAtom(hasExportedAtom);
  const setCurrentExportBlob = useSetAtom(currentExportBlobAtom);

  usePlaceholderGradientBootstrap({ assets, config, processColorAnalysis });

  const showFocusHint = useFocusHint(isScreenshotFocusedMode, lookCapabilities?.focusMode);
  const hasScreenshot = Boolean(config.assets.screenshot);
  const requiresScreenshot = lookCapabilities?.screenshot === "supported";
  const canExport = requiresScreenshot ? hasScreenshot : true;

  const handleExport = useExportHandler({
    hasScreenshot,
    requiresScreenshot,
    setStatusMessage,
    setIsExporting,
    config,
    currentLook,
    canvas,
    screenshotAsset,
    orientation,
    setHasExported,
    setCurrentExportBlob,
  });

  const toggleCanvasMode = useCanvasModeToggle(setConfig);

  const handleScreenshotUpload = useCallback(
    async (file?: File) => {
      if (!file) return;
      if (!requiresScreenshot) return;
      await handleFileProcess(file, "screenshot");
    },
    [handleFileProcess, requiresScreenshot],
  );

  const dragAndUpload = useDragAndUpload({
    onFileUpload: handleScreenshotUpload,
    isProcessingUpload,
    enabled: requiresScreenshot,
  });

  return {
    isMobile,
    statusMessage,
    hasCustomScreenshot,
    isProcessingUpload,
    isAnalyzingColors,
    showFocusHint,
    hasScreenshot,
    canExport,
    requiresScreenshot,
    isExporting,
    shouldShowAspectLock,
    isAspectLocked,
    canvas,
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
  requiresScreenshot,
  setStatusMessage,
  setIsExporting,
  config,
  currentLook,
  canvas,
  screenshotAsset,
  orientation,
  setHasExported,
  setCurrentExportBlob,
}: ExportContext) {
  return useCallback(async () => {
    if (requiresScreenshot && !hasScreenshot) {
      setStatusMessage("Please upload a screenshot before exporting.");
      return;
    }

    track("export_button_clicked", {
      look_id: config.layoutId,
      look_name: currentLook?.name ?? "unknown",
      variant: config.variant,
      background_type: config.background?.type ?? "unknown",
      font_style: config.fontStyle,
      orientation,
    });
    setIsExporting(true);
    setStatusMessage("Exporting image...");
    try {
      // Use high-resolution export dimensions
      const exportDims = EXPORT_ORIENTATION_DIMENSIONS[orientation];

      const maxImageScale =
        screenshotAsset?.metadata?.width && screenshotAsset?.metadata?.height
          ? Math.min(
              screenshotAsset.metadata.width / exportDims.width,
              screenshotAsset.metadata.height / exportDims.height,
            )
          : undefined;

      // Use blob export for memory persistence
      const { dataUrl, blob } = await exportLayoutAsPngWithBlob("export-container", {
        width: exportDims.width,
        height: exportDims.height,
        maxImageScale,
      });

      // Trigger download
      const link = document.createElement("a");
      link.download = "cover-image.png";
      link.href = dataUrl;
      link.click();

      // Store blob for voluntary save and update button state
      setCurrentExportBlob(blob);
      setHasExported(true);

      setStatusMessage("Image exported successfully.");

      // Track successful export
      track("export_completed", {
        look_id: config.layoutId,
        orientation,
      });
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
    config.fontStyle,
    config.layoutId,
    config.variant,
    currentLook?.name,
    hasScreenshot,
    orientation,
    requiresScreenshot,
    screenshotAsset?.metadata?.height,
    screenshotAsset?.metadata?.width,
    setIsExporting,
    setStatusMessage,
    setHasExported,
    setCurrentExportBlob,
  ]);
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
