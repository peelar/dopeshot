"use client";

import { ImageMetadata } from "@/domain/asset/types";

export async function getImageMetadataFromDataUrl(
  dataUrl: string,
): Promise<ImageMetadata | undefined> {
  if (!dataUrl) {
    return undefined;
  }

  return new Promise<ImageMetadata | undefined>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      if (!width || !height) {
        resolve(undefined);
        return;
      }

      resolve({
        width,
        height,
        aspectRatio: width / height,
      });
    };

    image.onerror = () => {
      resolve(undefined);
    };

    image.src = dataUrl;
  }).catch(() => undefined);
}
