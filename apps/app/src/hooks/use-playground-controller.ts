"use client";

import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/utils/toast";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  getExportDimensionsForLayout,
  getScreenshotTreatment,
} from "@/domain/layout/screenshot-mode";
import { getRandomDemoPreset } from "@/domain/demo/presets";
import { getLayoutFormat, type LayoutDefinition } from "@/domain/layout-def/definitions";
import { exportLayoutAsPngWithBlob, generateThumbnail } from "@/domain/layout/export";
import { useSession } from "@/lib/auth/auth-client";
import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";
import {
  assetsAtom,
  configAtom,
  hasCustomScreenshotAtom,
  isExportingAtom,
  orientationAtom,
  statusMessageAtom,
  hasExportedAtom,
  currentExportBlobAtom,
  showExportSheetAtom,
  exportThumbnailAtom,
  previewModeAtom,
  type PreviewMode,
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
  assets: Asset[];
  currentLook: LayoutDefinition | undefined;
  canvas: { width: number; height: number };
  screenshotAsset: Asset | undefined;
  orientation: "mobile" | "desktop";
  previewMode: PreviewMode;
  setHasExported: Setter<boolean>;
  setCurrentExportBlob: Setter<Blob | null>;
  setShowExportSheet: Setter<boolean>;
  setExportThumbnail: Setter<string | null>;
  isAuthenticated: boolean;
}

type Setter<T> = (value: T | ((prev: T) => T)) => void;

export function usePlaygroundController({ demoEnabled }: { demoEnabled: boolean }) {
  const isMobile = useMobileDetection();

  const [config, setConfig] = useAtom(configAtom);
  const setAssets = useSetAtom(assetsAtom);
  const orientation = useAtomValue(orientationAtom);
  const statusMessage = useAtomValue(statusMessageAtom);
  const [isExporting, setIsExporting] = useAtom(isExportingAtom);
  const hasCustomScreenshot = useAtomValue(hasCustomScreenshotAtom);
  const currentLook = useAtomValue(currentLayoutAtom);
  const lookCapabilities = useAtomValue(layoutCapabilitiesAtom);
  const canvas = useAtomValue(canvasAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const isScreenshotFocusedMode = useAtomValue(isScreenshotFocusedModeAtom);
  const shouldShowAspectLock = useAtomValue(shouldShowAspectLockAtom);
  const isAspectLocked = useAtomValue(isAspectLockedAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);
  const previewMode = useAtomValue(previewModeAtom);
  const [hasAppliedRandomPreset, setHasAppliedRandomPreset] = useState(false);

  const { isConfigDrawerOpen, setIsConfigDrawerOpen } = useConfigDrawer(isMobile);

  const { processColorAnalysis } = useColorAnalysis();
  const { handleFileProcess, isProcessingUpload } = useFileUpload({ processColorAnalysis });

  useDemoPreset({
    demoEnabled,
    hasAppliedRandomPreset,
    hasCustomScreenshot,
    setAssets,
    setConfig,
    setHasAppliedRandomPreset,
    processColorAnalysis,
  });

  // Export state atoms for voluntary save
  const setHasExported = useSetAtom(hasExportedAtom);
  const setCurrentExportBlob = useSetAtom(currentExportBlobAtom);

  // Export sheet atoms for post-export UI
  const setShowExportSheet = useSetAtom(showExportSheetAtom);
  const setExportThumbnail = useSetAtom(exportThumbnailAtom);

  // Auth state for conditional sheet display
  const { data: session } = useSession();

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
    assets,
    currentLook,
    canvas,
    screenshotAsset,
    orientation,
    previewMode,
    setHasExported,
    setCurrentExportBlob,
    setShowExportSheet,
    setExportThumbnail,
    isAuthenticated: Boolean(session?.session),
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
  demoEnabled,
  hasAppliedRandomPreset,
  hasCustomScreenshot,
  setAssets,
  setConfig,
  setHasAppliedRandomPreset,
  processColorAnalysis,
}: {
  demoEnabled: boolean;
  hasAppliedRandomPreset: boolean;
  hasCustomScreenshot: boolean;
  setAssets: Setter<Asset[]>;
  setConfig: Setter<LayoutConfig>;
  setHasAppliedRandomPreset: Setter<boolean>;
  processColorAnalysis: (
    dataUrl: string,
    assetId: string,
    autoLayoutMessage: string | null,
  ) => Promise<void>;
}) {
  useEffect(() => {
    if (!demoEnabled) return;
    if (hasAppliedRandomPreset || hasCustomScreenshot) return;

    const randomPreset = getRandomDemoPreset();
    setConfig(randomPreset.config);
    setAssets([randomPreset.asset]);
    setHasAppliedRandomPreset(true);
    void processColorAnalysis(randomPreset.asset.url, randomPreset.asset.id, null);
  }, [
    demoEnabled,
    hasAppliedRandomPreset,
    hasCustomScreenshot,
    setAssets,
    setConfig,
    setHasAppliedRandomPreset,
    processColorAnalysis,
  ]);
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

function useExportHandler({
  hasScreenshot,
  requiresScreenshot,
  setStatusMessage,
  setIsExporting,
  config,
  assets,
  currentLook,
  canvas,
  screenshotAsset,
  orientation,
  previewMode,
  setHasExported,
  setCurrentExportBlob,
  setShowExportSheet,
  setExportThumbnail,
  isAuthenticated,
}: ExportContext) {
  return useCallback(async () => {
    if (requiresScreenshot && !hasScreenshot) {
      setStatusMessage("Please upload a screenshot before exporting.");
      return;
    }

    const exportType = getLayoutFormat(config.layoutId) === "testimonial" ? "testimonial" : "screenshot";
    const format = previewMode === "video" ? "mp4" : "png";

    track("export_button_clicked", {
      format,
      look_id: config.layoutId,
      look_name: currentLook?.name ?? "unknown",
      variant: config.variant,
      background_type: config.background?.type ?? "unknown",
      font_style: config.fontStyle ?? "default",
      orientation,
      export_type: exportType,
    });
    setIsExporting(true);

    try {
      if (previewMode === "video") {
        await exportVideo({
          config,
          assets,
          screenshotAsset,
          setStatusMessage,
          setCurrentExportBlob,
          setHasExported,
        });
      } else {
        await exportImage({
          config,
          orientation,
          screenshotAsset,
          setStatusMessage,
          setCurrentExportBlob,
          setHasExported,
        });
      }

      track("export_completed", {
        format,
        look_id: config.layoutId,
        orientation,
        export_type: exportType,
      });

      // DEV FLAG: Force show modal for all users in development
      const DEV_FORCE_SHOW_MODAL = process.env.NODE_ENV === "development" && false; // Set to true to test modal

      // Show export success sheet for anonymous users (or all users if dev flag enabled)
      if (!isAuthenticated || DEV_FORCE_SHOW_MODAL) {
        // Generate thumbnail for the success sheet
        try {
          const thumbnail = await generateThumbnail("export-container");
          setExportThumbnail(thumbnail);
        } catch (err) {
          console.warn("Failed to generate thumbnail:", err);
          // Continue without thumbnail
        }

        // Show sheet after a short delay to let download complete
        setTimeout(() => {
          setShowExportSheet(true);
          track("export_sheet_shown", {
            user_type: DEV_FORCE_SHOW_MODAL ? "dev_testing" : "anonymous",
          });
        }, 500);
      }
    } catch (error) {
      console.error("Export Error Handler:", error);
      const msg = error instanceof Error ? error.message : "Unknown error occurred";
      setStatusMessage(`Export failed: ${msg}`);

      toast.error("Export failed", {
        description: msg,
      });

      track("export_failed", {
        error: msg,
        format,
        look_id: config.layoutId,
        orientation,
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    assets,
    canvas.height,
    canvas.width,
    config,
    currentLook?.name,
    hasScreenshot,
    orientation,
    previewMode,
    requiresScreenshot,
    screenshotAsset,
    setIsExporting,
    setStatusMessage,
    setHasExported,
    setCurrentExportBlob,
    setShowExportSheet,
    setExportThumbnail,
    isAuthenticated,
  ]);
}

async function exportImage({
  config,
  orientation,
  screenshotAsset,
  setStatusMessage,
  setCurrentExportBlob,
  setHasExported,
}: {
  config: LayoutConfig;
  orientation: "mobile" | "desktop";
  screenshotAsset: Asset | undefined;
  setStatusMessage: Setter<string>;
  setCurrentExportBlob: Setter<Blob | null>;
  setHasExported: Setter<boolean>;
}) {
  setStatusMessage("Exporting image...");

  const exportDims = getExportDimensionsForLayout(config, orientation);
  const maxImageScale =
    screenshotAsset?.metadata?.width && screenshotAsset?.metadata?.height
      ? Math.min(
          screenshotAsset.metadata.width / exportDims.width,
          screenshotAsset.metadata.height / exportDims.height,
        )
      : undefined;

  const { dataUrl, blob } = await exportLayoutAsPngWithBlob("export-container", {
    width: exportDims.width,
    height: exportDims.height,
    maxImageScale,
  });

  const link = document.createElement("a");
  link.download = "cover-image.png";
  link.href = dataUrl;
  link.click();

  setCurrentExportBlob(blob);
  setHasExported(true);
  setStatusMessage("Image exported successfully.");
}

async function exportVideo({
  config,
  assets,
  screenshotAsset,
  setStatusMessage,
  setCurrentExportBlob,
  setHasExported,
}: {
  config: LayoutConfig;
  assets: Asset[];
  screenshotAsset: Asset | undefined;
  setStatusMessage: Setter<string>;
  setCurrentExportBlob: Setter<Blob | null>;
  setHasExported: Setter<boolean>;
}) {
  setStatusMessage("Rendering video... 0%");

  const { getBackgroundStyle } = await import("@/components/layouts/shared/background-style");
  const { tokenToCssColor } = await import("@/components/layouts/shared/color-utils");
  const { getFontStyleCssValue } = await import("@/domain/layout/fonts");
  const { renderVideoToBlob } = await import("@/remotion/render");

  const assetMap = new Map(assets.map((a) => [a.id, a]));

  const blob = await renderVideoToBlob(
    {
      screenshotUrl: screenshotAsset?.url ?? "",
      title: config.text.title?.trim() ?? "",
      subtitle: config.text.subtitle?.trim() ?? "",
      backgroundCss: getBackgroundStyle(config, assetMap),
      fontFamily: getFontStyleCssValue(config.fontStyle ?? "founder"),
      textColor: tokenToCssColor(config.colors.text),
    },
    (progress) => {
      setStatusMessage(`Rendering video... ${Math.round(progress * 100)}%`);
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "cover-video.mp4";
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);

  setCurrentExportBlob(blob);
  setHasExported(true);
  setStatusMessage("Video exported successfully.");
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
