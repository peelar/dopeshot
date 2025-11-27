// Color palette extracted from images
export type ColorPalette = {
  dominant: string; // hex color
  accent: string; // hex color
  muted?: string; // hex color
  vibrant?: string; // hex color
};

// Asset represents uploaded files (screenshots, logos, icons, backgrounds, etc.)
export type Asset = {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  url: string;
  kind: "screenshot" | "logo" | "icon" | "background" | "other";
  createdAt: string;
  colorPalette?: ColorPalette; // populated after color analysis
};

