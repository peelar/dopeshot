import { getCatalogBackground, getCatalogBackgrounds } from "./catalog";
import type { BackgroundSelection, CatalogBackground, PersonalBackground } from "./types";

type ListResponse<T> = {
  items: T[];
};

export class BackgroundApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function listCatalogBackgrounds(options: {
  personality: string;
  limit?: number;
  offset?: number;
}): Promise<ListResponse<CatalogBackground>> {
  const all = getCatalogBackgrounds(options.personality);
  const offset = options.offset ?? 0;
  const limit = options.limit ?? all.length;
  return { items: all.slice(offset, offset + limit) };
}

export async function addCatalogBackground(catalogId: string): Promise<PersonalBackground> {
  const catalogItem = getCatalogBackground(catalogId);
  if (!catalogItem || !catalogItem.previewUrl) {
    throw new BackgroundApiError("Catalog background not found", 404);
  }

  return {
    id: `catalog-${catalogItem.id}`,
    name: catalogItem.personality,
    previewUrl: catalogItem.previewUrl,
    fileSizeKb: catalogItem.fileSizeKb,
    widthPx: catalogItem.widthPx,
    heightPx: catalogItem.heightPx,
    fileFormat: catalogItem.fileFormat,
    sourceType: "catalog",
    sourceId: catalogItem.id,
  };
}

export async function saveBackgroundSelection(
  selection: BackgroundSelection,
): Promise<BackgroundSelection> {
  return selection;
}

export async function clearBackgroundSelection(): Promise<void> {
  return;
}

export async function uploadPersonalBackground(options: {
  file: File;
  name?: string;
  widthPx?: number;
  heightPx?: number;
  fileFormat?: string;
}): Promise<PersonalBackground> {
  const previewUrl = URL.createObjectURL(options.file);
  const format = options.fileFormat || options.file.name.split(".").pop()?.toLowerCase() || "png";

  return {
    id: `upload-${crypto.randomUUID()}`,
    name: options.name ?? options.file.name.replace(/\.[^/.]+$/, ""),
    previewUrl,
    fileSizeKb: Math.max(1, Math.round(options.file.size / 1024)),
    widthPx: options.widthPx ?? 0,
    heightPx: options.heightPx ?? 0,
    fileFormat: format,
    sourceType: "upload",
    sourceId: null,
  };
}

export async function deletePersonalBackground(backgroundId: string): Promise<void> {
  void backgroundId;
}
