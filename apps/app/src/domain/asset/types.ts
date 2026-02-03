// Color palette extracted from images
export type ColorPalette = {
  dominant: string; // hex color
  accent: string; // hex color
  muted?: string; // hex color
  vibrant?: string; // hex color
  /** True average lightness of the source image (0-1). Used to detect dark screenshots. */
  sourceImageLightness?: number;
  /** Average saturation of the source image (0-1). */
  sourceImageSaturation?: number;
  /** Dominant hue angle (0-360) for the source image. */
  dominantHue?: number;
};

// Asset represents uploaded files (screenshots, logos, icons, backgrounds, etc.)
export type ImageMetadata = {
  width: number;
  height: number;
  aspectRatio: number;
  orientation?: "portrait" | "square" | "landscape" | "ultrawide";
};

export type Asset = {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  url: string;
  kind: "screenshot" | "logo" | "icon" | "background" | "other";
  createdAt: string;
  colorPalette?: ColorPalette; // populated after color analysis
  metadata?: ImageMetadata;
};
