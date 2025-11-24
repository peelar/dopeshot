"use client";

import { useState } from "react";
import { TEMPLATES } from "@/domain/layout/templates";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Asset } from "@/domain/asset/types";
import { Download } from "lucide-react";
import { exportLayoutAsPng } from "@/domain/layout/export";
import { PreviewViewport } from "@/components/preview-viewport";
import { ThemeToggle } from "@/components/theme-toggle";
import { TemplateSelector } from "@/components/template-selector";

const DEFAULT_ASSETS: Asset[] = [];

export default function PlaygroundPage() {
  // Use the first available template (now "popup-gradient")
  const [config, setConfig] = useState(TEMPLATES[0].createConfig());
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const hasScreenshot = !!config.assets.screenshot;

    if (!hasScreenshot) {
      alert("Please render a layout with a screenshot before exporting.");
      return;
    }

    setIsExporting(true);
    try {
      await exportLayoutAsPng("export-container", "cover-image.png");
    } catch (error) {
      console.error("Export Error Handler:", error);
      const msg = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to export image: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileProcess = (
    file: File,
    kind: "screenshot" | "logo" | "background" = "screenshot",
  ) => {
    // Use FileReader to create a data URL (base64) instead of blob URL
    // This avoids issues with html-to-image fetching blob resources
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const newAsset: Asset = {
        id: Math.random().toString(36).substring(7),
        projectId: "playground",
        userId: "playground-user",
        name: file.name,
        url: dataUrl,
        kind: kind === "background" ? "background" : kind === "logo" ? "logo" : "screenshot",
        createdAt: new Date().toISOString(),
      };
      setAssets((prev) => [...prev, newAsset]);
      setHasUploaded(true);

      // Auto-assign to correct asset field
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

        return newConfig;
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="bg-background text-foreground flex h-screen w-full flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-14 items-center justify-between border-b border-border px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="bg-foreground text-background flex h-5 w-5 items-center justify-center rounded-sm">
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
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={!hasUploaded || isExporting}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Export PNG"}
          </Button>
        </div>
      </header>

      {/* Template Selector */}
      {hasUploaded && (
        <TemplateSelector currentConfig={config} onSelect={setConfig} assets={assets} />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Preview Area */}
        <div className="bg-background flex flex-1 items-center justify-center overflow-auto p-8">
          <div className="flex w-full max-w-4xl items-center justify-center">
            {!hasUploaded ? (
              <div className="w-full max-w-md">
                <UploadDropzone onUpload={handleFileProcess} />
              </div>
            ) : (
              <PreviewViewport>
                <CoverPreview config={config} assets={assets} />
              </PreviewViewport>
            )}
          </div>
        </div>

        {/* Right Sidebar - Controls */}
        {hasUploaded && (
          <div className="bg-background w-80 border-l border-border">
            <LayoutConfigPanel
              config={config}
              onConfigChangeAction={setConfig}
              assets={assets}
              activeAssetId={assets.length > 0 ? assets[assets.length - 1].id : undefined}
              onUploadAsset={handleFileProcess}
            />
          </div>
        )}
      </div>

      {/* Hidden Export Container */}
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
        {/* The hidden surface mirrors the visible preview (same dimensions + markup) */}
        <CoverPreview config={config} assets={assets} />
      </div>
    </main>
  );
}
