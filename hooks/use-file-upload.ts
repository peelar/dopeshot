import { useCallback, useState } from "react";
import { Asset } from "@/domain/asset/types";
import { LayoutConfig } from "@/domain/layout/types";
import { processFileUpload, UploadResult } from "@/domain/asset/upload-orchestrator";
import { applyTemplateRecommendation, ASPECT_COPY } from "@/domain/layout/recommendations";
import { getRecommendationForAspectCategory } from "@/domain/layout/recommendations";
import { AspectCategory } from "@/domain/layout/aspect";

export interface UseFileUploadOptions {
  onAssetCreated: (asset: Asset) => void;
  onConfigUpdate: (updater: (config: LayoutConfig) => LayoutConfig) => void;
  onStatusMessage: (message: string) => void;
  onScreenshotUploaded?: (asset: Asset, aspectCategory?: AspectCategory) => void;
}

export function useFileUpload({
  onAssetCreated,
  onConfigUpdate,
  onStatusMessage,
  onScreenshotUploaded,
}: UseFileUploadOptions) {
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  const handleFileProcess = useCallback(
    async (file: File, kind: "screenshot" | "logo" | "background" = "screenshot") => {
      setIsProcessingUpload(true);

      try {
        const result = await processFileUpload(file, kind);
        const { asset, aspectCategory } = result;

        onAssetCreated(asset);
        onStatusMessage(`${kind.charAt(0).toUpperCase() + kind.slice(1)} uploaded: ${file.name}`);

        onConfigUpdate((currentConfig) => {
          const newConfig = {
            ...currentConfig,
            assets: {
              ...currentConfig.assets,
              [kind]: asset.id,
            },
          };

          if (kind === "background") {
            newConfig.background = {
              type: "image",
              value: asset.id,
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
            const recommendation = getRecommendationForAspectCategory(aspectCategory);
            const result = applyTemplateRecommendation(nextConfig, recommendation);
            nextConfig = result.config;

            if ((result.changedTemplate || result.changedVariant) && result.templateName) {
              onStatusMessage(
                `Detected ${ASPECT_COPY[aspectCategory] || aspectCategory} screenshot — switched to ${result.templateName}.`,
              );
            }
          }

          return nextConfig;
        });

        if (kind === "screenshot" && onScreenshotUploaded && aspectCategory) {
          onScreenshotUploaded(asset, aspectCategory);
        }
      } catch (error) {
        onStatusMessage("Failed to read file. Please try another image.");
        console.error("File upload error:", error);
      } finally {
        setIsProcessingUpload(false);
      }
    },
    [onAssetCreated, onConfigUpdate, onStatusMessage, onScreenshotUploaded],
  );

  return {
    handleFileProcess,
    isProcessingUpload,
  };
}
