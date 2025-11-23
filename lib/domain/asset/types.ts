// Asset represents uploaded files (screenshots, logos, icons, backgrounds, etc.)
export type Asset = {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  url: string;
  kind: "screenshot" | "logo" | "icon" | "background" | "other";
  createdAt: string;
};
