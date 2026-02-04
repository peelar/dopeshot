export type BackgroundType = "personal" | "catalog";

export type PersonalBackground = {
  id: string;
  name: string | null;
  previewUrl: string | null;
  fileSizeKb: number;
  widthPx: number;
  heightPx: number;
  fileFormat: string;
  sourceType?: "upload" | "catalog";
  sourceId?: string | null;
};

export type CatalogBackground = {
  id: string;
  personality: string;
  status: "published" | "approved" | "pending" | "rejected";
  previewUrl: string | null;
  fileSizeKb: number;
  widthPx: number;
  heightPx: number;
  fileFormat: string;
};

export type BackgroundSelection = {
  backgroundType: BackgroundType;
  backgroundId: string;
};
