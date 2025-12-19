export interface PresetBackground {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  url: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface BrandBackground {
  id: string;
  name?: string;
  url: string;
  thumbnailUrl: string | null;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}
