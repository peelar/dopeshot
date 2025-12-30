import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET_NAME = "memory-screenshots";
const SIGNED_URL_TTL = 3600; // 1 hour in seconds

/**
 * Upload a screenshot to Supabase storage for a memory item
 * @param userId - User ID (for folder organization)
 * @param memoryItemId - Memory item ID (for filename)
 * @param file - File buffer to upload
 * @returns Storage path on success
 */
export async function uploadScreenshot(
  userId: string,
  memoryItemId: string,
  file: Buffer,
): Promise<string> {
  const storagePath = `${userId}/${memoryItemId}.png`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: "image/png",
      upsert: false, // Prevent accidental overwrites
    });

  if (error) {
    throw new Error(`Failed to upload screenshot: ${error.message}`);
  }

  return storagePath;
}

/**
 * Delete a screenshot from Supabase storage
 * @param storagePath - Full storage path (userId/memoryItemId.png)
 */
export async function deleteScreenshot(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete screenshot: ${error.message}`);
  }
}

/**
 * Get a signed URL for accessing a screenshot
 * @param storagePath - Full storage path (userId/memoryItemId.png)
 * @param expiresIn - TTL in seconds (default: 3600)
 * @returns Signed URL
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = SIGNED_URL_TTL,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message ?? "Unknown error"}`);
  }

  return data.signedUrl;
}
