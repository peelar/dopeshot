import { useCallback, useState } from "react";
import { Asset } from "@/domain/asset/types";
import { LayoutConfig } from "@/domain/layout/types";
import { processFileUpload, UploadResult } from "@/domain/asset/upload-orchestrator";
import { applyTemplateRecommendation, ASPECT_COPY } from "@/domain/layout/recommendations";
import { getRecommendationForAspectCategory } from "@/domain/layout/recommendations";
import { AspectCategory } from "@/domain/layout/aspect";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const ACCEPTED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "svg"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface UseFileUploadOptions {
  onAssetCreated: (asset: Asset, kind: "screenshot" | "logo" | "background") => void;
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

  const validateFile = useCallback(
    (file: File) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const matchesMime = file.type ? ACCEPTED_IMAGE_TYPES.has(file.type) : false;
      const matchesExtension = extension ? ACCEPTED_EXTENSIONS.has(extension) : false;

      if (!(matchesMime || matchesExtension)) {
        onStatusMessage("Unsupported format. Use PNG, JPG, WebP, or SVG.");
        return false;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        onStatusMessage("File is too large. Max size is 10MB.");
        return false;
      }

      return true;
    },
    [onStatusMessage],
  );

  const handleFileProcess = useCallback(
    async (file: File, kind: "screenshot" | "logo" | "background" = "screenshot") => {
      if (!validateFile(file)) {
        return;
      }
      setIsProcessingUpload(true);

      try {
        const result = await processFileUpload(file, kind);
        const { asset, aspectCategory } = result;

        onAssetCreated(asset, kind);
        onStatusMessage(`${kind.charAt(0).toUpperCase() + kind.slice(1)} uploaded: ${file.name}`);

        onConfigUpdate((currentConfig) => {
          const grainEnabled = currentConfig.background?.grainEnabled ?? true;
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
              grainEnabled,
            };
          }

          let nextConfig = newConfig;

          if (kind === "screenshot") {
            nextConfig = {
              ...nextConfig,
              background: {
                type: "solid",
                value: "slate-100",
                grainEnabled,
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
    [onAssetCreated, onConfigUpdate, onStatusMessage, onScreenshotUploaded, validateFile],
  );

  return {
    handleFileProcess,
    isProcessingUpload,
  };
}
