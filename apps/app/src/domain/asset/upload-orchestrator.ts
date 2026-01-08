import { Asset } from "./types";
import { getImageMetadataFromDataUrl } from "./get-image-metadata";
import { getAspectCategory, AspectCategory } from "@/domain/layout/aspect";
import { uploadPersonalBackground } from "@/domain/backgrounds/background-service";
import { compressImageFile, MAX_UPLOAD_SIZE_KB } from "./compress-image";

export interface UploadResult {
  asset: Asset;
  aspectCategory?: AspectCategory;
  metadata?: {
    width: number;
    height: number;
    aspectRatio: number;
    orientation: AspectCategory;
  };
}

export async function processFileUpload(
  file: File,
  kind: "screenshot" | "logo" | "background",
): Promise<UploadResult> {
  // Compress image to ensure it's under the upload size limit
  const compressionResult = await compressImageFile(file, MAX_UPLOAD_SIZE_KB);
  const dataUrl = compressionResult.dataUrl;

  return new Promise((resolve, reject) => {
    const processUpload = async () => {

      let assetMetadata = undefined;
      let aspectCategory: AspectCategory | undefined;
      let backgroundRecord: Awaited<ReturnType<typeof uploadPersonalBackground>> | null = null;

      if (kind === "screenshot" || kind === "background") {
        try {
          const metadata = await getImageMetadataFromDataUrl(dataUrl);
          if (metadata) {
            const orientation = getAspectCategory(metadata.aspectRatio);
            if (kind === "screenshot") {
              aspectCategory = orientation;
            }
            assetMetadata = { ...metadata, orientation };
          }
        } catch (metadataError) {
          // Non-critical: continue without metadata
          console.warn("Failed to extract image metadata:", metadataError);
        }
      }

      if (kind === "background") {
        try {
          const extension = file.name.split(".").pop()?.toLowerCase();
          const fileFormat = extension || file.type.split("/").pop() || "png";
          const compressedFile = await dataUrlToFile(
            dataUrl,
            file.name,
            `image/${fileFormat}`,
          );
          backgroundRecord = await uploadPersonalBackground({
            file: compressedFile,
            name: file.name,
            widthPx: assetMetadata?.width,
            heightPx: assetMetadata?.height,
            fileFormat,
          });
        } catch (uploadError) {
          const errorMessage = uploadError instanceof Error
            ? uploadError.message
            : "Failed to upload background";
          reject(new Error(errorMessage));
          return;
        }
      }

      const assetId = backgroundRecord?.id ?? Math.random().toString(36).substring(7);
      const asset: Asset = {
        id: assetId,
        projectId: "playground",
        userId: "playground-user",
        name: backgroundRecord?.name ?? file.name,
        url: backgroundRecord?.previewUrl ?? dataUrl,
        kind: kind === "background" ? "background" : kind === "logo" ? "logo" : "screenshot",
        createdAt: new Date().toISOString(),
        metadata: assetMetadata,
      };

      resolve({
        asset,
        aspectCategory,
        metadata: assetMetadata,
      });
    };

    processUpload().catch(reject);
  });
}

/**
 * Converts a data URL back to a File object for server upload.
 */
async function dataUrlToFile(
  dataUrl: string,
  filename: string,
  mimeType: string
): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
}





