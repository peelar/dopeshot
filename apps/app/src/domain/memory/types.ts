/**
 * Memory Configuration Schema
 * Represents a complete snapshot of the editor state for a memory item
 */

import type { LayoutConfig } from "@/domain/layout/types";
import type { Asset } from "@/domain/asset/types";

export interface MemoryConfiguration {
  // Schema version for future migrations
  version: 1;

  // Layout identification
  layoutId: string;
  variant: string;
  orientation: "desktop" | "mobile";

  // Screenshot reference (relative path in Supabase storage)
  screenshotPath: string;

  // Full layout configuration
  config: LayoutConfig;

  // Referenced assets needed to restore the editor state
  assets?: Asset[];

  // Rendering state
  renderingFlags: {
    aspectLocked: boolean;
    screenshotZoom: number;
  };
}

/**
 * Memory Item DTO for client-side use
 */
export interface MemoryItemDTO {
  id: string;
  screenshotUrl: string; // Signed URL for thumbnail
  isShared: boolean;
  shareUrl: string | null;
  createdAt: string; // ISO 8601
}

/**
 * Full Memory Item with configuration
 */
export interface MemoryItemFull extends MemoryItemDTO {
  configuration: MemoryConfiguration;
}
