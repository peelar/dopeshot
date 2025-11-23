import { LayoutConfig } from "../layout/types";

// Composition represents a complete cover design with its layout configuration
export type Composition = {
  id: string;
  projectId: string; // Reference to the parent Project.id
  userId: string; // Reference to the owner user
  name: string; // User-friendly name for this composition
  layoutConfig: LayoutConfig; // Complete layout definition stored as JSON
  createdAt: string; // ISO timestamp of creation
  updatedAt: string; // ISO timestamp of last update
};
