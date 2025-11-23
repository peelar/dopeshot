"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutConfig } from "@/domain/layout/types";
import { LayoutConfigPanel } from "@/components/layout-config";
import { CoverPreview } from "@/components/cover-preview";
import { UploadPlaceholder } from "@/components/upload-placeholder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateComposition } from "./actions";
import { Loader2 } from "lucide-react";

interface EditorClientProps {
  initialConfig: LayoutConfig;
  compositionId: string;
  projectId: string;
  projectName: string;
}

export function EditorClient({
  initialConfig,
  compositionId,
  projectId,
  projectName,
}: EditorClientProps) {
  const [config, setConfig] = useState<LayoutConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [lastSavedConfig, setLastSavedConfig] = useState<LayoutConfig>(initialConfig);
  const [currentCompositionId, setCurrentCompositionId] = useState(compositionId);

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

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
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

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="flex min-h-[480px] items-center justify-center overflow-hidden bg-slate-100 p-8">
          <CoverPreview config={config} />
        </Card>
        <div className="flex h-[600px] flex-col space-y-4">
          <LayoutConfigPanel config={config} onChange={setConfig} />
          <UploadPlaceholder />
        </div>
      </section>
    </main>
  );
}
