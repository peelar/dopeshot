export type BackgroundType = "personal";

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
