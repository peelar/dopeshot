import { useCallback } from "react";
import { useSetAtom, useAtom, useAtomValue } from "jotai";
import { track } from "@/lib/analytics";
import { Asset } from "@/domain/asset/types";
import { processFileUpload } from "@/domain/asset/upload-orchestrator";
import { analyzeImageTextContrast } from "@/domain/asset/image-text-contrast";
import { applyLayoutRecommendation, ASPECT_COPY, getRecommendationForAspectCategory } from "@/domain/layout/recommendations";
import { AspectCategory } from "@/domain/layout/aspect";
import { saveBackgroundSelection } from "@/domain/backgrounds/background-service";
import {
  configAtom,
  assetsAtom,
  statusMessageAtom,
  isProcessingUploadAtom,
  hasCustomScreenshotAtom,
  screenshotGradientAtom,
} from "./atoms";
import { expandSidebarSectionAtom } from "./use-sidebar-state";
import { backgroundSelectionAtom } from "./atoms/backgrounds";
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const ACCEPTED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "svg"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface UseFileUploadOptions {
  onScreenshotUploaded?: (asset: Asset, aspectCategory?: AspectCategory) => Promise<void>;
  processColorAnalysis?: (
    dataUrl: string,
    assetId: string,
    autoLayoutMessage: string | null,
  ) => Promise<void>;
}

export function useFileUpload({
  onScreenshotUploaded,
  processColorAnalysis,
}: UseFileUploadOptions) {
  const isBlank = (value?: string) => !value || !value.trim();
  const [isProcessingUpload, setIsProcessingUpload] = useAtom(isProcessingUploadAtom);
  const setBackgroundSelection = useSetAtom(backgroundSelectionAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setConfig = useSetAtom(configAtom);
  const setStatusMessage = useSetAtom(statusMessageAtom);
  const setHasCustomScreenshot = useSetAtom(hasCustomScreenshotAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const expandSidebarSection = useSetAtom(expandSidebarSectionAtom);

  const validateFile = useCallback(
    (file: File) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const matchesMime = file.type ? ACCEPTED_IMAGE_TYPES.has(file.type) : false;
      const matchesExtension = extension ? ACCEPTED_EXTENSIONS.has(extension) : false;

      if (!(matchesMime || matchesExtension)) {
        setStatusMessage("Unsupported format. Use PNG, JPG, WebP, or SVG.");
        return false;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setStatusMessage("File is too large. Max size is 10MB.");
        return false;
      }

      return true;
    },
    [setStatusMessage],
  );

  const handleFileProcess = useCallback(
    async (file: File, kind: "screenshot" | "logo" | "background" | "avatar" = "screenshot") => {
      if (!validateFile(file)) {
        return;
      }
      setIsProcessingUpload(true);

      try {
        const result = await processFileUpload(file, kind);
        const { asset, aspectCategory } = result;

        setAssets((prev) => [...prev, asset]);
        setStatusMessage(`${kind.charAt(0).toUpperCase() + kind.slice(1)} uploaded: ${file.name}`);

        if (kind === "screenshot") {
          setHasCustomScreenshot(true);
          setScreenshotGradient(null);
          track("screenshot_uploaded", {
            aspect_category: aspectCategory || "unknown",
            file_size_kb: Math.round(file.size / 1024),
          });
        } else if (kind === "background") {
          try {
            const selection = await saveBackgroundSelection({
              backgroundType: "personal",
              backgroundId: asset.id,
            });
            setBackgroundSelection({
              backgroundType: selection.backgroundType,
              backgroundId: selection.backgroundId,
            });
          } catch (error) {
            setStatusMessage(
              "Background uploaded, but selection could not be saved. Please reselect it.",
            );
          }
        } else if (kind === "logo") {
          track("logo_uploaded", {
            file_size_kb: Math.round(file.size / 1024),
          });
        } else if (kind === "avatar") {
          track("testimonial_author_edited", {
            field: "avatar",
          });
        }

        setConfig((currentConfig) => {
          // Don't auto-apply logos to canvas - user must toggle "apply to all screenshots"
          // For avatars, store the asset ID in testimonial settings
          if (kind === "avatar") {
            return {
              ...currentConfig,
              layoutSpecificSettings: {
                ...currentConfig.layoutSpecificSettings,
                testimonial: {
                  ...currentConfig.layoutSpecificSettings?.testimonial,
                  authorAvatarAssetId: asset.id,
                  showAuthorAvatar: true,
                },
              },
            };
          }
          const newConfig = kind === "logo"
            ? currentConfig
            : {
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
          const shouldApplyHeadline =
            kind === "screenshot" &&
            isBlank(currentConfig.text.title) &&
            isBlank(currentConfig.text.subtitle);

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
            const result = applyLayoutRecommendation(nextConfig, recommendation);
            nextConfig = result.config;

            if ((result.changedLayout || result.changedVariant) && result.layoutName) {
              setStatusMessage(
                `Detected ${ASPECT_COPY[aspectCategory] || aspectCategory} screenshot — switched to ${result.layoutName}.`,
              );
            }
          }

          if (shouldApplyHeadline) {
            nextConfig = {
              ...nextConfig,
              text: {
                ...nextConfig.text,
                title: "Your product looks dope",
                subtitle: "And now your screenshot does too",
              },
            };
          }

          return nextConfig;
        });

        if (kind === "background") {
          const { palette, textColor } = await analyzeImageTextContrast(asset.url);
          if (palette) {
            setAssets((prev) =>
              prev.map((existing) =>
                existing.id === asset.id ? { ...existing, colorPalette: palette } : existing,
              ),
            );
          }

          if (textColor) {
            setConfig((currentConfig) => {
              if (
                currentConfig.background?.type !== "image" ||
                currentConfig.background.value !== asset.id
              ) {
                return currentConfig;
              }

              return {
                ...currentConfig,
                colors: {
                  ...currentConfig.colors,
                  text: textColor,
                },
              };
            });
          }
        }

        if (kind === "screenshot" && onScreenshotUploaded && aspectCategory) {
          await onScreenshotUploaded(asset, aspectCategory);
        }

        if (kind === "screenshot" && processColorAnalysis) {
          await processColorAnalysis(asset.url, asset.id, null);
        }

        // Auto-expand relevant sections after upload
        if (kind === "screenshot") {
          // Expand background section after screenshot upload
          expandSidebarSection("background");
        } else if (kind === "logo") {
          // Expand look section after logo upload
          expandSidebarSection("look");
        } else if (kind === "background") {
          // Expand look section after background upload
          expandSidebarSection("look");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to read file. Please try another image.";
        setStatusMessage(message);
        console.error("File upload error:", error);
      } finally {
        setIsProcessingUpload(false);
      }
    },
    [
      validateFile,
      setIsProcessingUpload,
      setAssets,
      setConfig,
      setStatusMessage,
      setBackgroundSelection,
      setHasCustomScreenshot,
      setScreenshotGradient,
      onScreenshotUploaded,
      processColorAnalysis,
      expandSidebarSection,
    ],
  );

  return {
    handleFileProcess,
    isProcessingUpload,
  };
}
