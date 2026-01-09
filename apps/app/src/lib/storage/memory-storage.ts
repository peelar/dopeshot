import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET_NAME = "memory-screenshots";
const SIGNED_URL_TTL = 3600; // 1 hour in seconds

/**
 * Upload a screenshot to Supabase storage for a memory item
 * @param userId - User ID (for folder organization)
 * @param memoryItemId - Memory item ID (for filename)
 * @param file - File buffer to upload
 * @param contentType - MIME type (defaults to image/png, can be image/jpeg for compressed images)
 * @returns Storage path on success
 */
export async function uploadScreenshot(
  userId: string,
  memoryItemId: string,
  file: Buffer,
  contentType: "image/png" | "image/jpeg" = "image/png",
): Promise<string> {
  const extension = contentType === "image/jpeg" ? "jpg" : "png";
  const storagePath = `${userId}/${memoryItemId}.${extension}`;

  // #region agent log
  console.log('[DEBUG] uploadScreenshot starting', { userId, memoryItemId, storagePath, contentType, fileSize: file.length, bucket: BUCKET_NAME });
  // #endregion

  const { error, data } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType,
      upsert: false, // Prevent accidental overwrites
    });

  // #region agent log
  if (error) {
    console.error('[DEBUG] Supabase storage upload error', { error: error.message, statusCode: (error as any).statusCode, bucket: BUCKET_NAME, storagePath });
  } else {
    console.log('[DEBUG] Supabase upload success', { data, storagePath });
  }
  // #endregion

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
