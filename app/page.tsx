"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Download } from "lucide-react";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { Button } from "@/components/ui/button";
import { exportLayoutAsPng } from "@/domain/layout/export";
import { PreviewViewport } from "@/components/preview-viewport";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { PLACEHOLDER_ASSET_ID, usePlaygroundState } from "@/hooks/use-playground-state";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useColorAnalysis } from "@/hooks/use-color-analysis";
import { useStatusMessage } from "@/hooks/use-status-message";
import { useFocusHint } from "@/hooks/use-focus-hint";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { getTemplateById } from "@/domain/layout/templates";

export default function PlaygroundPage() {
  const { theme } = useTheme();
  const {
    config,
    setConfig,
    assets,
    setAssets,
    currentTemplate,
    templateCapabilities,
    canvas,
    isScreenshotFocusedMode,
    shouldShowAspectLock,
    isAspectLocked,
    showLayoutToggle,
  } = usePlaygroundState();

  const { statusMessage, announce } = useStatusMessage();
  const [isExporting, setIsExporting] = useState(false);
  const [hasCustomScreenshot, setHasCustomScreenshot] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

  const gradientPreferences = useMemo<GradientPreferences>(() => {
    return {
      angle: getPreferredGradientAngle(config),
      temperature: theme === "dark" ? "cool" : "warm",
      intensity: isScreenshotFocused(config) ? "bold" : "balanced",
    };
  }, [config, theme]);

  const { processColorAnalysis, isAnalyzingColors } = useColorAnalysis({
    onAssetUpdate: setAssets,
    onConfigUpdate: setConfig,
    onStatusMessage: announce,
    gradientPreferences,
  });

  const { handleFileProcess, isProcessingUpload } = useFileUpload({
    onAssetCreated: (asset, kind) => {
      setAssets((prev) => [...prev, asset]);
      if (kind === "screenshot") {
        setHasCustomScreenshot(true);
      }
    },
    onConfigUpdate: setConfig,
    onStatusMessage: announce,
    onScreenshotUploaded: async (asset, aspectCategory) => {
      await processColorAnalysis(asset.url, asset.id, null);
    },
  });

  useEffect(() => {
    const placeholderAsset = assets.find((asset) => asset.id === PLACEHOLDER_ASSET_ID);
    if (!placeholderAsset || placeholderAsset.colorPalette) {
      return;
    }

    void processColorAnalysis(placeholderAsset.url, placeholderAsset.id, null);
  }, [assets, processColorAnalysis]);

  const showFocusHint = useFocusHint(isScreenshotFocusedMode, templateCapabilities?.focusMode);
  const hasScreenshot = Boolean(config.assets.screenshot);

  const handleExport = useCallback(async () => {
    if (!hasScreenshot) {
      announce("Please upload a screenshot before exporting.");
      return;
    }

    setIsExporting(true);
    announce("Exporting image...");
    try {
      await exportLayoutAsPng("export-container", "cover-image.png", {
        width: canvas.width,
        height: canvas.height,
      });
      announce("Image exported successfully.");
    } catch (error) {
      console.error("Export Error Handler:", error);
      const msg = error instanceof Error ? error.message : "Unknown error occurred";
      announce(`Export failed: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  }, [announce, canvas.height, canvas.width, hasScreenshot]);

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
    [isFileDrag],
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
    [isFileDrag],
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
    [handleScreenshotUpload, isFileDrag],
  );

  const uploadButtonLabel = isProcessingUpload
    ? "Uploading..."
    : hasCustomScreenshot
      ? "Change Screenshot"
      : "Upload Your Screenshot";
  const uploadButtonShort = isProcessingUpload
    ? "Working"
    : hasCustomScreenshot
      ? "Change"
      : "Upload";
  const uploadButtonGlyph = isProcessingUpload ? "⏳" : hasCustomScreenshot ? "🔄" : "📸";

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

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <a
          href="/"
          aria-label="Go to homepage"
          className="flex items-center gap-2 pl-4 transition-opacity hover:opacity-80"
        >
          <div
            className="flex h-5 w-5 items-center justify-center rounded-sm bg-foreground text-background"
            aria-hidden="true"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="2" width="20" height="20" rx="4" transform="rotate(45 12 12)" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">dopeshot</span>
        </a>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            className="flex items-center gap-2"
            onClick={openFilePicker}
            disabled={isProcessingUpload}
            aria-label={hasCustomScreenshot ? "Change screenshot" : "Upload your screenshot"}
            aria-busy={isProcessingUpload}
          >
            <span aria-hidden="true">{uploadButtonGlyph}</span>
            <span className="hidden sm:inline">{uploadButtonLabel}</span>
            <span className="sm:hidden">{uploadButtonShort}</span>
          </Button>
          {hasScreenshot ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              aria-busy={isExporting}
              aria-label={isExporting ? "Exporting image" : "Export as PNG"}
            >
              <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              {isExporting ? "Exporting..." : "Export PNG"}
            </Button>
          ) : null}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-10 pt-4 sm:px-8">
        <TemplateSelector currentConfig={config} onSelect={setConfig} assets={assets} />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden bg-background px-2 pb-8 pt-4 sm:px-4 sm:pt-6">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              {showLayoutToggle ? (
                <LayoutVariantToggle config={config} onVariantChange={handleVariantChange} />
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
                  <CoverPreview config={config} assets={assets} onUploadAsset={handleFileProcess} />
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
            <LayoutConfigPanel
              config={config}
              onConfigChangeAction={setConfig}
              assets={assets}
              onUploadAsset={handleFileProcess}
            />
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
          }}
        >
          <CoverPreview config={config} assets={assets} isStatic />
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
