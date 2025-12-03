"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { track } from "@vercel/analytics";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { exportLayoutAsPng } from "@/domain/layout/export";
import { PreviewViewport } from "@/components/preview-viewport";
import { TemplateSelector } from "@/components/template-selector";
import { useTheme } from "next-themes";
import { LayoutVariantToggle } from "@/components/layout-variant-toggle";
import { cn } from "@/utils";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";
import { getPreferredGradientAngle } from "@/domain/layout/gradient-application";
import { PLACEHOLDER_ASSET_ID } from "@/hooks/atoms";
import { getRandomDemoPreset } from "@/domain/demo/presets";
import {
  configAtom,
  assetsAtom,
  statusMessageAtom,
  isExportingAtom,
  hasCustomScreenshotAtom,
  isDraggingAtom,
  isAnalyzingColorsAtom,
} from "@/hooks/atoms";
import {
  currentTemplateAtom,
  templateCapabilitiesAtom,
  canvasAtom,
  isScreenshotFocusedModeAtom,
  shouldShowAspectLockAtom,
  isAspectLockedAtom,
  showLayoutToggleAtom,
  screenshotAssetAtom,
} from "@/hooks/atoms/derived";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useColorAnalysis } from "@/hooks/use-color-analysis";
import { useFocusHint } from "@/hooks/use-focus-hint";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { getTemplateById } from "@/domain/layout/templates";
import { AppHeader } from "@/components/app-header";

export default function PlaygroundPage() {
  const { theme } = useTheme();
  const [config, setConfig] = useAtom(configAtom);
  const [assets, setAssets] = useAtom(assetsAtom);
  const statusMessage = useAtomValue(statusMessageAtom);
  const [isExporting, setIsExporting] = useAtom(isExportingAtom);
  const hasCustomScreenshot = useAtomValue(hasCustomScreenshotAtom);
  const [isDragging, setIsDragging] = useAtom(isDraggingAtom);
  const isAnalyzingColors = useAtomValue(isAnalyzingColorsAtom);
  const currentTemplate = useAtomValue(currentTemplateAtom);
  const templateCapabilities = useAtomValue(templateCapabilitiesAtom);
  const canvas = useAtomValue(canvasAtom);
  const screenshotAsset = useAtomValue(screenshotAssetAtom);
  const isScreenshotFocusedMode = useAtomValue(isScreenshotFocusedModeAtom);
  const shouldShowAspectLock = useAtomValue(shouldShowAspectLockAtom);
  const isAspectLocked = useAtomValue(isAspectLockedAtom);
  const showLayoutToggle = useAtomValue(showLayoutToggleAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);
  const setHasCustomScreenshot = useSetAtom(hasCustomScreenshotAtom);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);
  const [hasAppliedRandomPreset, setHasAppliedRandomPreset] = useState(false);

  // Apply random demo preset on client mount (after hydration)
  // This sets text content and template - gradient comes from color analysis below
  useEffect(() => {
    if (hasAppliedRandomPreset || hasCustomScreenshot) return;

    const randomPreset = getRandomDemoPreset();
    setConfig(randomPreset.config);
    setAssets([randomPreset.asset]);
    setHasAppliedRandomPreset(true);
  }, [hasAppliedRandomPreset, hasCustomScreenshot, setConfig, setAssets]);

  const gradientPreferences = useMemo<GradientPreferences>(() => {
    return {
      angle: getPreferredGradientAngle(config),
      temperature: theme === "dark" ? "cool" : "warm",
      intensity: isScreenshotFocused(config) ? "bold" : "balanced",
    };
  }, [config, theme]);

  const { processColorAnalysis } = useColorAnalysis({ gradientPreferences });

  const { handleFileProcess, isProcessingUpload } = useFileUpload({
    processColorAnalysis,
  });

  // Run color analysis when demo asset doesn't have a gradient set yet
  useEffect(() => {
    const placeholderAsset = assets.find((asset) => asset.id === PLACEHOLDER_ASSET_ID);
    const hasGradientSet = config.background?.customGradient !== undefined;
    const usingCustomGradientSlot =
      config.background?.type === "gradient" && config.background?.value === "custom";

    // Skip if no placeholder, gradient already exists, or user switched away from custom gradients
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

  const showFocusHint = useFocusHint(isScreenshotFocusedMode, templateCapabilities?.focusMode);
  const hasScreenshot = Boolean(config.assets.screenshot);

  const handleExport = useCallback(async () => {
    if (!hasScreenshot) {
      setStatusMessage("Please upload a screenshot before exporting.");
      return;
    }

    track("export_button_clicked");
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
    setStatusMessage,
    canvas.height,
    canvas.width,
    hasScreenshot,
    setIsExporting,
    config.background?.grainEnabled,
    screenshotAsset?.metadata?.height,
    screenshotAsset?.metadata?.width,
  ]);

  const handleVariantChange = useCallback(
    (variant: string) => {
      setConfig((currentConfig) => {
        const template = getTemplateById(currentConfig.templateId);
        if (
          !template ||
          !template.variants.includes(variant) ||
          currentConfig.variant === variant
        ) {
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

  const toggleCanvasMode = useCallback(() => {
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

  const handleScreenshotUpload = useCallback(
    async (file?: File) => {
      if (!file) return;
      await handleFileProcess(file, "screenshot");
    },
    [handleFileProcess],
  );

  const handleFilePickerChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await handleScreenshotUpload(file);
      }
      event.target.value = "";
    },
    [handleScreenshotUpload],
  );

  const openFilePicker = useCallback(() => {
    if (isProcessingUpload) return;
    uploadInputRef.current?.click();
  }, [isProcessingUpload]);

  const isFileDrag = useCallback((event: DragEvent<HTMLElement>) => {
    return Array.from(event.dataTransfer?.types ?? []).includes("Files");
  }, []);

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragCounterRef.current += 1;
      setIsDragging(true);
    },
    [isFileDrag, setIsDragging],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [isFileDrag],
  );

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    [isFileDrag, setIsDragging],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLElement>) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        await handleScreenshotUpload(file);
      }
    },
    [handleScreenshotUpload, isFileDrag, setIsDragging],
  );

  return (
    <main
      className="relative flex min-h-screen flex-col bg-background text-foreground"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-500/15">
          <div className="rounded-2xl border-4 border-dashed border-blue-400 bg-white/80 px-10 py-8 text-center shadow-2xl">
            <p className="text-2xl font-semibold text-slate-900">Drop your screenshot here</p>
            <p className="text-sm text-slate-600">PNG, JPG, WebP, or SVG · Max 10MB</p>
          </div>
        </div>
      ) : null}

      <AppHeader
        hasCustomScreenshot={hasCustomScreenshot}
        isProcessingUpload={isProcessingUpload}
        onUploadClick={openFilePicker}
        hasScreenshot={hasScreenshot}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <div className="flex flex-1 flex-col gap-4 px-4 pb-10 pt-4 sm:px-8">
        <TemplateSelector />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden bg-background px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              {showLayoutToggle ? (
                <LayoutVariantToggle onVariantChange={handleVariantChange} />
              ) : null}

              {shouldShowAspectLock ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={toggleCanvasMode}
                    aria-pressed={isAspectLocked}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
                      isAspectLocked
                        ? "border-foreground/30 bg-foreground/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                    )}
                  >
                    {isAspectLocked ? "Locked · 16:9" : "Lock to 16:9"}
                  </button>
                </div>
              ) : null}

              <div className="relative flex w-full justify-center">
                <PreviewViewport
                  surfaceWidth={canvas.width}
                  surfaceHeight={canvas.height}
                  isLoading={isAnalyzingColors}
                  loadingText="Analyzing colors..."
                >
                  <CoverPreview onUploadAsset={handleFileProcess} />
                </PreviewViewport>
                {showFocusHint ? (
                  <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                    <span className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/80 shadow-sm ring-1 ring-border/70">
                      Screenshot-focused layout active
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="w-80 border-l border-border bg-background">
            <LayoutConfigPanel onUploadAsset={handleFileProcess} />
          </div>
        </div>
      </div>

      {hasScreenshot ? (
        <div
          id="export-container"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: `${canvas.width}px`,
            height: `${canvas.height}px`,
            zIndex: -100,
            visibility: "visible",
            background: "white",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            textRendering: "optimizeLegibility",
          }}
        >
          <CoverPreview isStatic />
        </div>
      ) : null}

      <input
        type="file"
        ref={uploadInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFilePickerChange}
        aria-hidden="true"
        tabIndex={-1}
        disabled={isProcessingUpload}
      />

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>
    </main>
  );
}
