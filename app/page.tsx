"use client";

import { useState } from "react";
import { TEMPLATES } from "@/domain/layout/templates";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Asset } from "@/domain/asset/types";
import { RefreshCw, Upload } from "lucide-react";

const DEFAULT_ASSETS: Asset[] = [];

export default function PlaygroundPage() {
  const [config, setConfig] = useState(TEMPLATES[0].createConfig());
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [hasUploaded, setHasUploaded] = useState(false);

  const handleReset = () => {
    setConfig(TEMPLATES[0].createConfig());
    setAssets([]);
    setHasUploaded(false);
  };

  const handleFileProcess = (file: File) => {
    const newAsset: Asset = {
      id: Math.random().toString(36).substring(7),
      projectId: "playground",
      userId: "playground-user",
      name: file.name,
      url: URL.createObjectURL(file),
      kind: "screenshot",
      createdAt: new Date().toISOString(),
    };
    setAssets((prev) => [...prev, newAsset]);
    setHasUploaded(true);

    // Auto-assign to first screenshot primitive if available
    const screenshotPrim = config.primitives.find((p) => p.type === "screenshot");
    if (screenshotPrim) {
      const newPrimitives = config.primitives.map((p) =>
        p.id === screenshotPrim.id ? { ...p, assetId: newAsset.id } : p,
      );
      setConfig({ ...config, primitives: newPrimitives });
    }
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
              <label htmlFor="file-upload-header">
                <Button variant="outline" size="sm" asChild className="cursor-pointer">
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Replace Image
                  </span>
                </Button>
              </label>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-500">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Preview Area */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-8">
          <Card className="flex w-full max-w-4xl items-center justify-center overflow-hidden bg-white p-8 shadow-sm">
            {!hasUploaded ? (
              <div className="h-[600px] w-full">
                <UploadDropzone onUpload={handleFileProcess} />
              </div>
            ) : (
              <CoverPreview config={config} assets={assets} />
            )}
          </Card>
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
    </main>
  );
}
