"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { TEMPLATES, getTemplateById, withTemplateTextDefaults } from "@/domain/layout/templates";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Asset, ColorPalette } from "@/domain/asset/types";
import { exportLayoutAsPng } from "@/domain/layout/export";
import { PreviewViewport } from "@/components/preview-viewport";
import { ThemeToggle } from "@/components/theme-toggle";
import { TemplateSelector } from "@/components/template-selector";
import {
  getContrastTextColor,
  generateGradient,
  generateGradientOptions,
  isAdvancedGradient,
} from "@/domain/layout/gradients";
import { analyzeColors as analyzeImageColors } from "@/domain/asset/analyze-colors";
import { Sora } from "next/font/google";
import { LayoutVariantToggle } from "@/components/layout-variant-toggle";
import { cn } from "@/utils";
import { getImageMetadataFromDataUrl } from "@/domain/asset/get-image-metadata";
import {
  getAspectCategory,
  getRecommendationForCategory,
  AspectCategory,
} from "@/domain/layout/aspect";
import { LayoutConfig } from "@/domain/layout/types";
import {
  DEFAULT_LOCKED_ASPECT_RATIO,
  getCanvasDimensions,
  getScreenshotTreatment,
  isScreenshotFocused,
} from "@/domain/layout/screenshot-mode";

const DEFAULT_ASSETS: Asset[] = [];
const sora = Sora({ subsets: ["latin"] });

type TemplateRecommendation = {
  templateId: string;
  variant?: string;
};

const ASPECT_COPY: Record<AspectCategory, string> = {
  portrait: "portrait",
  square: "square",
  landscape: "landscape",
  ultrawide: "ultra-wide",
};

function applyTemplateRecommendation(
  config: LayoutConfig,
  recommendation?: TemplateRecommendation,
): {
  config: LayoutConfig;
  changedTemplate: boolean;
  changedVariant: boolean;
  templateName?: string;
} {
  if (!recommendation) {
    return { config, changedTemplate: false, changedVariant: false };
  }

  const template = getTemplateById(recommendation.templateId);
  if (!template) {
    return { config, changedTemplate: false, changedVariant: false };
  }

  const defaultConfig = template.createConfig();
  const variantCandidate =
    recommendation.variant && template.variants.includes(recommendation.variant)
      ? recommendation.variant
      : undefined;

  if (config.templateId !== template.id) {
    const nextConfig = withTemplateTextDefaults({
      ...defaultConfig,
      templateId: template.id,
      variant: variantCandidate || defaultConfig.variant || template.variants[0] || config.variant,
      text: config.text,
      colors: config.colors,
      background: config.background,
      assets: config.assets,
      screenshotShadow: config.screenshotShadow,
      fontId: config.fontId,
      fontSize: config.fontSize,
      screenshotFrame: config.screenshotFrame ?? defaultConfig.screenshotFrame,
    });

    return {
      config: nextConfig,
      changedTemplate: true,
      changedVariant: true,
      templateName: template.name,
    };
  }

  if (variantCandidate && variantCandidate !== config.variant) {
    return {
      config: {
        ...config,
        variant: variantCandidate,
        screenshotFrame: config.screenshotFrame ?? defaultConfig.screenshotFrame,
      },
      changedTemplate: false,
      changedVariant: true,
      templateName: template.name,
    };
  }

  return { config, changedTemplate: false, changedVariant: false };
}

export default function PlaygroundPage() {
  const [config, setRawConfig] = useState(() => withTemplateTextDefaults(TEMPLATES[0].createConfig()));
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzingColors, setIsAnalyzingColors] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [showFocusHint, setShowFocusHint] = useState(false);
  const focusHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTemplate = useMemo(() => getTemplateById(config.templateId), [config.templateId]);
  const templateCapabilities = currentTemplate?.capabilities;
  const screenshotAsset = useMemo(
    () => assets.find((asset) => asset.id === config.assets.screenshot),
    [assets, config.assets.screenshot],
  );
  const canvas = useMemo(() => getCanvasDimensions(config, screenshotAsset), [config, screenshotAsset]);
  const screenshotTreatment = useMemo(() => getScreenshotTreatment(config), [config]);
  const isScreenshotFocusedMode = useMemo(() => isScreenshotFocused(config), [config]);
  const shouldShowAspectLock =
    templateCapabilities?.canvasBehavior === "text-dependent" && !isScreenshotFocusedMode;
  const isAspectLocked = screenshotTreatment.canvasMode === "locked";

  useEffect(() => {
    if (templateCapabilities?.focusMode !== "auto") {
      setShowFocusHint(false);
      if (focusHintTimeoutRef.current) {
        clearTimeout(focusHintTimeoutRef.current);
        focusHintTimeoutRef.current = null;
      }
      return () => undefined;
    }

    if (isScreenshotFocusedMode) {
      if (focusHintTimeoutRef.current) {
        clearTimeout(focusHintTimeoutRef.current);
      }
      setShowFocusHint(true);
      focusHintTimeoutRef.current = setTimeout(() => {
        setShowFocusHint(false);
        focusHintTimeoutRef.current = null;
      }, 2000);
    } else {
      setShowFocusHint(false);
      if (focusHintTimeoutRef.current) {
        clearTimeout(focusHintTimeoutRef.current);
        focusHintTimeoutRef.current = null;
      }
    }

    return () => {
      if (focusHintTimeoutRef.current) {
        clearTimeout(focusHintTimeoutRef.current);
        focusHintTimeoutRef.current = null;
      }
    };
  }, [isScreenshotFocusedMode, templateCapabilities?.focusMode]);

  const announce = useCallback((message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 3000);
  }, []);

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

  const setConfig = useCallback(
    (next: LayoutConfig | ((current: LayoutConfig) => LayoutConfig)) => {
      setRawConfig((currentConfig) => {
        const computed = typeof next === "function" ? (next as (c: LayoutConfig) => LayoutConfig)(currentConfig) : next;
        return withTemplateTextDefaults(computed);
      });
    },
    [],
  );

  const handleVariantChange = useCallback((variant: string) => {
    setConfig((currentConfig) => {
      const template = getTemplateById(currentConfig.templateId);
      if (!template || !template.variants.includes(variant) || currentConfig.variant === variant) {
        return currentConfig;
      }

      return {
        ...currentConfig,
        variant,
      };
    });
  }, []);

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
  }, []);

  const showLayoutToggle = (currentTemplate?.variants.length ?? 0) > 1;

  const analyzeColors = useCallback(async (dataUrl: string): Promise<ColorPalette | undefined> => {
    return analyzeImageColors(dataUrl);
  }, []);

  const handleFileProcess = useCallback(
    (file: File, kind: "screenshot" | "logo" | "background" = "screenshot") => {
      const reader = new FileReader();
      setIsProcessingUpload(true);

      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          setIsProcessingUpload(false);
          return;
        }

        let assetMetadata = undefined;
        let aspectCategory: AspectCategory | undefined;
        let autoLayoutMessage: string | null = null;

        if (kind === "screenshot") {
          const metadata = await getImageMetadataFromDataUrl(dataUrl);
          if (metadata) {
            aspectCategory = getAspectCategory(metadata.aspectRatio);
            assetMetadata = { ...metadata, orientation: aspectCategory };
          }
        }

        const assetId = Math.random().toString(36).substring(7);
        const newAsset: Asset = {
          id: assetId,
          projectId: "playground",
          userId: "playground-user",
          name: file.name,
          url: dataUrl,
          kind: kind === "background" ? "background" : kind === "logo" ? "logo" : "screenshot",
          createdAt: new Date().toISOString(),
          metadata: assetMetadata,
        };
        setAssets((prev) => [...prev, newAsset]);
        setHasUploaded(true);
        announce(`${kind.charAt(0).toUpperCase() + kind.slice(1)} uploaded: ${file.name}`);

        setConfig((currentConfig) => {
          const newConfig = {
            ...currentConfig,
            assets: {
              ...currentConfig.assets,
              [kind]: newAsset.id,
            },
          };

          if (kind === "background") {
            newConfig.background = {
              type: "image",
              value: newAsset.id,
            };
          }

          let nextConfig = newConfig;

          if (kind === "screenshot") {
            nextConfig = {
              ...nextConfig,
              background: {
                type: "solid",
                value: "slate-100",
              },
            };
          }

          if (kind === "screenshot" && aspectCategory) {
            const recommendation = getRecommendationForCategory(aspectCategory);
            const result = applyTemplateRecommendation(nextConfig, recommendation);
            nextConfig = result.config;

            if ((result.changedTemplate || result.changedVariant) && result.templateName) {
              autoLayoutMessage = `Detected ${ASPECT_COPY[aspectCategory] || aspectCategory} screenshot — switched to ${result.templateName}.`;
            }
          }

          return nextConfig;
        });

        if (kind === "screenshot") {
          setIsAnalyzingColors(true);
          announce("Analyzing colors from screenshot...");

          try {
            const colorPalette = await analyzeColors(dataUrl);

            if (colorPalette) {
              setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, colorPalette } : a)));

              // Generate gradient options and use the first one (from "sampled from your screenshot")
              // Use landscape and undefined variant to match the gradient picker context
              const contextAspect = aspectCategory ?? "landscape";

              setConfig((currentConfig) => {
                // Generate with same context as gradient picker (landscape, undefined variant)
                // This ensures the gradient matches one from the list
                const gradientOptions = generateGradientOptions(colorPalette, {
                  aspectCategory: "landscape",
                  templateVariant: undefined,
                });

                // Use the first gradient from the options (multi-color strategy)
                const generatedGradient = gradientOptions[0];

                // Determine text color from first stop of gradient
                const firstStopColor = isAdvancedGradient(generatedGradient)
                  ? (generatedGradient.stops[0]?.color ?? colorPalette.accent)
                  : colorPalette.accent;
                const textColor = getContrastTextColor(firstStopColor);

                return {
                  ...currentConfig,
                  colors: {
                    ...currentConfig.colors,
                    text: textColor,
                  },
                  background: {
                    type: "gradient",
                    value: "custom",
                    customGradient: generatedGradient,
                  },
                };
              });
              const gradientMessage = autoLayoutMessage
                ? `${autoLayoutMessage} Gradient applied based on your screenshot colors.`
                : "Gradient applied based on your screenshot colors.";
              autoLayoutMessage = null;
              announce(gradientMessage);
            }
          } finally {
            setIsAnalyzingColors(false);
          }
        }

        setIsProcessingUpload(false);
        if (autoLayoutMessage) {
          announce(autoLayoutMessage);
        }
      };

      reader.onerror = () => {
        setIsProcessingUpload(false);
        setIsAnalyzingColors(false);
        announce("Failed to read file. Please try another image.");
      };

      reader.readAsDataURL(file);
    },
    [analyzeColors, announce],
  );

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
