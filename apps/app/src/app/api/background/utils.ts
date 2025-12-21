// API utilities for background management

import {
  sanitizeFilename,
  validateFileType,
  validateFileSize,
  getFileExtension,
  VALIDATION_ERRORS,
} from "@/domain/background/validation";

export function sanitizeFileExtension(filename: string): string {
  const ext = getFileExtension(filename);
  const baseName = filename.substring(0, filename.lastIndexOf(".")) || filename;
  const sanitized = sanitizeFilename(baseName);
  return ext ? `${sanitized}.${ext}` : sanitized;
}

export function validateBackgroundFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Validate file type
  if (!validateFileType(file.type)) {
    return { valid: false, error: VALIDATION_ERRORS.INVALID_FILE_TYPE };
  }

  // Validate file size
  if (!validateFileSize(file.size)) {
    return { valid: false, error: VALIDATION_ERRORS.FILE_TOO_LARGE };
  }

  return { valid: true };
}

export function generateStoragePath(userId: string, filename: string): string {
  // Generate path: {userId}/backgrounds/{filename}
  return `${userId}/backgrounds/${filename}`;
}

export const API_ERRORS = {
  UNAUTHORIZED: "Unauthorized. Please log in.",
  MISSING_FORM_DATA: "Missing form data.",
  MISSING_FILE: "File is required.",
  MISSING_BACKGROUND_ID: "backgroundId is required.",
  BACKGROUND_NOT_FOUND: "Background not found.",
  FETCH_FAILED: "Failed to fetch backgrounds.",
  DELETE_FAILED: "Deletion failed. Please try again.",
  DUPLICATE_FILENAME: VALIDATION_ERRORS.DUPLICATE_FILENAME,
} as const;
