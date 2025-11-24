"use client";

import { useState } from "react";
import { TEMPLATES } from "@/domain/layout/templates";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Asset } from "@/domain/asset/types";
import { RefreshCw, Upload, Download } from "lucide-react";
import { exportLayoutAsPng } from "@/domain/layout/export";

const DEFAULT_ASSETS: Asset[] = [];

export default function PlaygroundPage() {
  // Use the first available template (now "popup-gradient")
  const [config, setConfig] = useState(TEMPLATES[0].createConfig());
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleReset = () => {
    setConfig(TEMPLATES[0].createConfig());
    setAssets([]);
    setHasUploaded(false);
  };

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

  const handleFileProcess = (file: File) => {
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
        kind: "screenshot",
        createdAt: new Date().toISOString(),
      };
      setAssets((prev) => [...prev, newAsset]);
      setHasUploaded(true);

      // Auto-assign to screenshot asset if available
      setConfig((currentConfig) => ({
        ...currentConfig,
        assets: {
          ...currentConfig.assets,
          screenshot: newAsset.id,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
            Cover Forge
          </span>
          <span className="text-sm text-slate-500">Playground</span>
        </div>
        <div className="flex items-center gap-2">
          {hasUploaded && (
            <div className="relative">
              <input
                type="file"
                id="file-upload-header"
                className="hidden"
                accept="image/*"
                onChange={handleAssetUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload-header")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Replace Image
              </Button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-500">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={!hasUploaded || isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export PNG"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Preview Area */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-8">
          <div className="flex w-full max-w-4xl items-center justify-center bg-white p-8">
            {!hasUploaded ? (
              <div className="h-[600px] w-full">
                <UploadDropzone onUpload={handleFileProcess} />
              </div>
            ) : (
              <CoverPreview config={config} assets={assets} />
            )}
          </div>
        </div>

        {/* Right Sidebar - Controls */}
        {hasUploaded && (
          <div className="w-80 border-l border-slate-200 bg-white">
            <LayoutConfigPanel
              config={config}
              onChange={setConfig}
              assets={assets}
              activeAssetId={assets.length > 0 ? assets[assets.length - 1].id : undefined}
            />
          </div>
        )}
      </div>

      {/* Hidden Export Container */}
      <div
        id="export-container"
        style={{
          position: "fixed", // Fixed position to ensure it's relative to the viewport
          top: 0,
          left: 0, // In the viewport
          width: "1200px",
          height: "630px",
          zIndex: -100, // Behind everything
          visibility: "visible", // Explicitly visible
          background: "white", // Ensure background is present
        }}
      >
        {/* We render the preview without the border/radius for the final export if desired,
            but CoverPreview has them hardcoded. Ideally we might want to remove them for export
            so the user gets clean corners, but for now we'll keep consistent with preview.
            However, CoverPreview adds a border-slate-200.
            To make it clean, we might want to override className to remove border/radius.
        */}
        <CoverPreview config={config} assets={assets} className="rounded-none border-0" />
      </div>
    </main>
  );
}
