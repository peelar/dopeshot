export type BackgroundType = "preset" | "personal";

export type PresetBackground = {
  id: string;
  name: string;
  previewUrl: string | null;
  sortOrder: number;
  description?: string | null;
};

export type PersonalBackground = {
  id: string;
  name: string | null;
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
