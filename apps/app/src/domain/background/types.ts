// Domain types for background management

export type BackgroundAsset = {
  id: string;
  userId: string;
  name: string;
  imagePath: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  createdAt: string;
  signedUrl?: string; // Computed on fetch
};

export type CuratedBackground = {
  id: string;
  name: string;
  imagePath: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  publicUrl?: string; // Computed on fetch
};

export type BackgroundSource = "user" | "curated";

export type BackgroundListResponse = {
  user: BackgroundAsset[];
  curated: CuratedBackground[];
};

export type BackgroundDimensions = {
  width: number;
  height: number;
};
