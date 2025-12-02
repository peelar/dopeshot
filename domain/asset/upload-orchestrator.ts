import { Asset } from "./types";
import { getImageMetadataFromDataUrl } from "./get-image-metadata";
import { getAspectCategory, AspectCategory } from "@/domain/layout/aspect";

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error("Failed to read file"));
        return;
      }

      let assetMetadata = undefined;
      let aspectCategory: AspectCategory | undefined;

      if (kind === "screenshot") {
        const metadata = await getImageMetadataFromDataUrl(dataUrl);
        if (metadata) {
          aspectCategory = getAspectCategory(metadata.aspectRatio);
          assetMetadata = { ...metadata, orientation: aspectCategory };
        }
      }

      const assetId = Math.random().toString(36).substring(7);
      const asset: Asset = {
        id: assetId,
        projectId: "playground",
        userId: "playground-user",
        name: file.name,
        url: dataUrl,
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

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

