import { Asset } from "./types";
import { getImageMetadataFromDataUrl } from "./get-image-metadata";
import { getAspectCategory, AspectCategory } from "@/domain/layout/aspect";
import { uploadPersonalBackground } from "@/domain/backgrounds/background-service";

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
      let backgroundRecord: Awaited<ReturnType<typeof uploadPersonalBackground>> | null = null;

      if (kind === "screenshot" || kind === "background") {
        const metadata = await getImageMetadataFromDataUrl(dataUrl);
        if (metadata) {
          const orientation = getAspectCategory(metadata.aspectRatio);
          if (kind === "screenshot") {
            aspectCategory = orientation;
          }
          assetMetadata = { ...metadata, orientation };
        }
      }

      if (kind === "background") {
        const extension = file.name.split(".").pop()?.toLowerCase();
        const fileFormat = extension || file.type.split("/").pop() || "png";
        backgroundRecord = await uploadPersonalBackground({
          file,
          name: file.name,
          widthPx: assetMetadata?.width,
          heightPx: assetMetadata?.height,
          fileFormat,
        });
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

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}






