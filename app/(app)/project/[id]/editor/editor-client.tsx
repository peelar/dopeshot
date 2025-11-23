"use client";

import { useState, useEffect } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { ScreenshotUploadGate } from "@/components/screenshot-upload-gate";
import { CompositionSidebar } from "@/components/composition-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateComposition } from "./actions";
import { Loader2 } from "lucide-react";
import { Asset } from "@/domain/asset/types";
import { hasScreenshot } from "@/domain/asset/utils";
import { Composition } from "@/domain/composition/types";

interface EditorClientProps {
  initialConfig: LayoutConfig;
  compositionId: string;
  projectId: string;
  projectName: string;
  assets: Asset[];
}

export function EditorClient({
  initialConfig,
  compositionId,
  projectId,
  projectName,
  assets,
}: EditorClientProps) {
  const [config, setConfig] = useState<LayoutConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [lastSavedConfig, setLastSavedConfig] = useState<LayoutConfig>(initialConfig);
  const [currentCompositionId, setCurrentCompositionId] = useState(compositionId);

  // Check if composition has screenshot
  const composition: Composition = {
    id: currentCompositionId,
    projectId,
    userId: "", // Not needed for hasScreenshot check
    name: "",
    layoutConfig: config,
    createdAt: "",
    updatedAt: "",
  };
  const hasScreenshotAsset = hasScreenshot(composition, assets);

  // Auto-save logic
  useEffect(() => {
    if (config === lastSavedConfig) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const newCompositionId = await updateComposition(currentCompositionId, config, projectId);
        if (newCompositionId && currentCompositionId === "temp") {
          setCurrentCompositionId(newCompositionId);
        }
        setLastSavedConfig(config);
      } catch (error) {
        console.error("Failed to save", error);
      } finally {
        setSaving(false);
      }
    }, 1000); // Debounce 1s

    return () => clearTimeout(timer);
  }, [config, lastSavedConfig, currentCompositionId, projectId]);

  const handleUploadCompleteAction = (newLayoutConfig: LayoutConfig) => {
    setConfig(newLayoutConfig);
    setLastSavedConfig(newLayoutConfig);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Sidebar */}
      <CompositionSidebar
        currentCompositionId={currentCompositionId}
        currentProjectId={projectId}
        assets={assets}
      />

      {/* Center: Upload Gate or Preview */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase text-slate-500">Editor</p>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">{projectName}</h1>
                {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                {!saving && config !== lastSavedConfig && (
                  <span className="text-xs text-amber-500">Unsaved changes...</span>
                )}
              </div>
            </div>
            <Button variant="outline" disabled={saving}>
              Save snapshot
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-50 p-8">
          {hasScreenshotAsset ? (
            <Card className="flex min-h-[480px] w-full max-w-4xl items-center justify-center overflow-hidden bg-white p-8">
              <CoverPreview config={config} assets={assets} />
            </Card>
          ) : (
            <ScreenshotUploadGate
              projectId={projectId}
              compositionId={currentCompositionId}
              layoutConfig={config}
              onUploadCompleteAction={handleUploadCompleteAction}
            />
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="w-80 border-l border-slate-200 bg-white">
        <div className="flex h-full flex-col space-y-4 overflow-y-auto p-4">
          {hasScreenshotAsset && <LayoutConfigPanel config={config} onChange={setConfig} />}
        </div>
      </div>
    </div>
  );
}
