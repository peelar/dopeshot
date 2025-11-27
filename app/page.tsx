"use client";

import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { TEMPLATES, getTemplateById } from "@/domain/layout/templates";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Asset, ColorPalette } from "@/domain/asset/types";
import { exportLayoutAsPng } from "@/domain/layout/export";
import { PreviewViewport } from "@/components/preview-viewport";
import { ThemeToggle } from "@/components/theme-toggle";
import { TemplateSelector } from "@/components/template-selector";
import { getContrastTextColor } from "@/domain/layout/gradient-utils";
import { ColorPaletteResponse } from "@/app/api/analyze-colors/route";
import { Sora } from "next/font/google";
import { LayoutVariantToggle } from "@/components/layout-variant-toggle";
import { cn } from "@/utils";

const DEFAULT_ASSETS: Asset[] = [];
const sora = Sora({ subsets: ["latin"] });

export default function PlaygroundPage() {
  const [config, setConfig] = useState(TEMPLATES[0].createConfig());
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzingColors, setIsAnalyzingColors] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const currentTemplate = useMemo(() => getTemplateById(config.templateId), [config.templateId]);

  const announce = useCallback((message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 3000);
  }, []);

  const handleTextChange = useCallback((field: "title" | "subtitle", value: string) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      text: {
        ...currentConfig.text,
        [field]: value,
      },
    }));
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
      await exportLayoutAsPng("export-container", "cover-image.png");
      announce("Image exported successfully.");
    } catch (error) {
      console.error("Export Error Handler:", error);
      const msg = error instanceof Error ? error.message : "Unknown error occurred";
      announce(`Export failed: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  }, [config.assets.screenshot, announce]);

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

  const showLayoutToggle = (currentTemplate?.variants.length ?? 0) > 1;

  const analyzeColors = useCallback(async (dataUrl: string): Promise<ColorPalette | undefined> => {
    try {
      const response = await fetch("/api/analyze-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: dataUrl }),
      });
      if (!response.ok) return undefined;
      const data: ColorPaletteResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Color analysis failed:", error);
      return undefined;
    }
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

        const assetId = Math.random().toString(36).substring(7);
        const newAsset: Asset = {
          id: assetId,
          projectId: "playground",
          userId: "playground-user",
          name: file.name,
          url: dataUrl,
          kind: kind === "background" ? "background" : kind === "logo" ? "logo" : "screenshot",
          createdAt: new Date().toISOString(),
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

          if (kind === "screenshot") {
            newConfig.background = {
              type: "solid",
              value: "slate-100",
            };
          }

          return newConfig;
        });

        if (kind === "screenshot") {
          setIsAnalyzingColors(true);
          announce("Analyzing colors from screenshot...");

          try {
            const colorPalette = await analyzeColors(dataUrl);

            if (colorPalette) {
              setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, colorPalette } : a)));

              const gradientColor = colorPalette.vibrant ?? colorPalette.accent;
              const textColor = getContrastTextColor(gradientColor);
              setConfig((currentConfig) => ({
                ...currentConfig,
                colors: {
                  ...currentConfig.colors,
                  text: textColor,
                },
                background: {
                  type: "gradient",
                  value: "custom",
                  customGradient: {
                    from: gradientColor,
                    to: "#ffffff",
                    direction: "to right",
                  },
                },
              }));
              announce("Gradient applied based on your screenshot colors.");
            }
          } finally {
            setIsAnalyzingColors(false);
          }
        }

        setIsProcessingUpload(false);
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
          <span className="text-sm font-bold tracking-tight">dopeshot</span>
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
              <div
                className={cn(
                  "mx-auto flex w-full max-w-4xl flex-col",
                  showLayoutToggle ? "gap-4" : "gap-2",
                )}
              >
                {showLayoutToggle ? (
                  <LayoutVariantToggle config={config} onVariantChange={handleVariantChange} />
                ) : null}

                <div className="flex w-full justify-center">
                  <PreviewViewport isLoading={isAnalyzingColors} loadingText="Analyzing colors...">
                    <CoverPreview
                      config={config}
                      assets={assets}
                      onTextChange={handleTextChange}
                      onUploadAsset={handleFileProcess}
                    />
                  </PreviewViewport>
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
            width: "1280px",
            height: "720px",
            zIndex: -100,
            visibility: "visible",
            background: "white",
          }}
        >
          <CoverPreview config={config} assets={assets} />
        </div>
      ) : null}

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>
    </main>
  );
}
