"use client";

import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { exportLayoutAsPng } from "@/domain/layout/export";
import { PreviewViewport } from "@/components/preview-viewport";
import { ThemeToggle } from "@/components/theme-toggle";
import { TemplateSelector } from "@/components/template-selector";
import { useTheme } from "next-themes";
import { Sora } from "next/font/google";
import { LayoutVariantToggle } from "@/components/layout-variant-toggle";
import { cn } from "@/utils";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";
import { getPreferredGradientAngle } from "@/domain/layout/gradient-application";
import { usePlaygroundState } from "@/hooks/use-playground-state";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useColorAnalysis } from "@/hooks/use-color-analysis";
import { useStatusMessage } from "@/hooks/use-status-message";
import { useFocusHint } from "@/hooks/use-focus-hint";
import type { GradientPreferences } from "@/domain/gradient-generation";
import { getTemplateById } from "@/domain/layout/templates";

const sora = Sora({ subsets: ["latin"] });

export default function PlaygroundPage() {
  const { theme } = useTheme();
  const {
    config,
    setConfig,
    assets,
    setAssets,
    hasUploaded,
    setHasUploaded,
    currentTemplate,
    templateCapabilities,
    screenshotAsset,
    canvas,
    isScreenshotFocusedMode,
    shouldShowAspectLock,
    isAspectLocked,
    showLayoutToggle,
  } = usePlaygroundState();

  const { statusMessage, announce } = useStatusMessage();
  const [isExporting, setIsExporting] = useState(false);

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
    onAssetCreated: (asset) => {
      setAssets((prev) => [...prev, asset]);
      setHasUploaded(true);
    },
    onConfigUpdate: setConfig,
    onStatusMessage: announce,
    onScreenshotUploaded: async (asset, aspectCategory) => {
      await processColorAnalysis(asset.url, asset.id, null);
    },
  });

  const showFocusHint = useFocusHint(isScreenshotFocusedMode, templateCapabilities?.focusMode);

  const handleExport = useCallback(async () => {
    const hasScreenshot = !!config.assets.screenshot;

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
  }, [canvas.height, canvas.width, config.assets.screenshot, announce]);

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          {hasUploaded ? (
            <Button
              variant="default"
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

      {!hasUploaded ? (
        <section className="mx-auto flex max-w-7xl flex-col gap-10 px-8 pb-16 pt-10 sm:pt-14">
          <div className="max-w-3xl space-y-4">
            <h1
              className={`${sora.className} text-[32px] font-medium leading-[1.2] tracking-[calc(-0.015em)] sm:text-[4rem] sm:leading-[1.15] lg:text-[60px] lg:leading-[1.1]`}
            >
              <span className="inline-block font-normal">
                Your product is{" "}
                <span className="bg-gradient-to-r from-[#EA580C] to-[#EC4899] bg-clip-text text-transparent">
                  dope
                </span>
                <span className="bg-gradient-to-r from-[#EA580C] to-[#EC4899] bg-clip-text align-middle text-[0.95em] text-transparent">
                  .
                </span>
              </span>
              <br />
              <span className="inline-block font-extrabold">
                Your screenshots
                <br />
                should be{" "}
                <span className="bg-gradient-to-r from-[#EA580C] to-[#EC4899] bg-clip-text text-transparent">
                  too
                </span>
              </span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              Go from raw screenshot to polished social post in seconds. Drag a file, or click to
              upload.
            </p>
          </div>

          <div className="w-full max-w-3xl">
            <UploadDropzone
              onUpload={(file) => handleFileProcess(file, "screenshot")}
              isUploading={isProcessingUpload}
            />
          </div>
        </section>
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-8">
          <TemplateSelector currentConfig={config} onSelect={setConfig} assets={assets} />

          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden bg-background px-4 pb-8 pt-4 sm:p-8">
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
                    <CoverPreview
                      config={config}
                      assets={assets}
                      onUploadAsset={handleFileProcess}
                    />
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
      )}

      {hasUploaded ? (
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

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>
    </main>
  );
}
