"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addScreenshotPrimitive } from "@/domain/layout/engine";
import { LayoutConfig } from "@/domain/layout/types";

interface ScreenshotUploadGateProps {
  projectId: string;
  compositionId: string;
  layoutConfig: LayoutConfig;
  onUploadCompleteAction: (newLayoutConfig: LayoutConfig) => void;
}

export function ScreenshotUploadGate({
  projectId,
  compositionId,
  layoutConfig,
  onUploadCompleteAction,
}: ScreenshotUploadGateProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      const validTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a PNG, JPEG, or WebP image");
        return;
      }

      setUploading(true);
      try {
        // Convert file to data URL (in-memory)
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Create asset record with data URL
        const { createAssetRecord } = await import(
          "@/app/(app)/project/[id]/editor/actions"
        );
        const asset = await createAssetRecord(projectId, dataUrl, file.name, "screenshot");

        // Add screenshot primitive to layout
        const newLayoutConfig = addScreenshotPrimitive(layoutConfig, {
          assetId: asset.id,
        });

        // Update composition
        const { updateComposition } = await import(
          "@/app/(app)/project/[id]/editor/actions"
        );
        await updateComposition(compositionId, newLayoutConfig, projectId);

        // Update local state and refresh to get new assets
        onUploadCompleteAction(newLayoutConfig);
        router.refresh();
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload screenshot. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [projectId, compositionId, layoutConfig, onUploadCompleteAction],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile],
  );

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className={`relative flex h-[400px] w-full max-w-2xl flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          dragActive
            ? "border-violet-500 bg-violet-50"
            : "border-slate-300 bg-slate-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="screenshot-upload"
          className="hidden"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          disabled={uploading}
        />
        <label
          htmlFor="screenshot-upload"
          className="flex cursor-pointer flex-col items-center justify-center gap-4"
        >
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Uploading...</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-slate-200 p-4">
                <Upload className="h-8 w-8 text-slate-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">
                  Upload a screenshot to start designing
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Drag and drop an image here, or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  PNG, JPEG, or WebP
                </p>
              </div>
              <Button type="button" variant="outline" className="mt-2">
                Choose file
              </Button>
            </>
          )}
        </label>
      </div>
    </div>
  );
}

