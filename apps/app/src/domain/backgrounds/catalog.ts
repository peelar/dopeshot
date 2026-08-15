import type { BrandPersonality } from "@/lib/types/brand";
import type { CatalogBackground } from "./types";
import catalog from "./catalog.json";

export type CatalogManifestItem = {
  id: string;
  personality: BrandPersonality;
  fileName: string;
  fileSizeKb: number;
  widthPx: number;
  heightPx: number;
  fileFormat: string;
};

type CatalogManifest = {
  version: 1;
  items: CatalogManifestItem[];
};

const manifest = catalog as CatalogManifest;

function catalogPublicPath(fileName: string): string {
  return `/backgrounds/catalog/${fileName}`;
}

export function getCatalogBackgrounds(personality?: string): CatalogBackground[] {
  const items = personality
    ? manifest.items.filter((item) => item.personality === personality)
    : manifest.items;

  return items.map((item) => ({
    id: item.id,
    personality: item.personality,
    status: "published",
    previewUrl: catalogPublicPath(item.fileName),
    fileSizeKb: item.fileSizeKb,
    widthPx: item.widthPx,
    heightPx: item.heightPx,
    fileFormat: item.fileFormat,
  }));
}

export function getCatalogBackground(id: string): CatalogBackground | undefined {
  return getCatalogBackgrounds().find((item) => item.id === id);
}
