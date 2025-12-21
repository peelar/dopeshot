// Background file validation utilities

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export function sanitizeFilename(filename: string): string {
  // Handle empty or whitespace-only filenames
  if (!filename || filename.trim().length === 0) {
    return "untitled";
  }

  // Remove path traversal attempts
  let sanitized = filename
    .replace(/\.\.\//g, "") // Remove ../
    .replace(/\.\.\\/g, "") // Remove ..\
    .split("/")
    .pop()! // Get basename (removes any path components)
    .split("\\")
    .pop()!; // Handle Windows paths

  // Remove dangerous characters but preserve spaces, dots, and unicode
  sanitized = sanitized
    .replace(/[<>:"|?*]/g, "") // Remove dangerous chars
    .replace(/\s+/g, "-") // Convert spaces to hyphens
    .trim();

  // Limit length to 255 characters (preserve extension)
  if (sanitized.length > 255) {
    const ext = getFileExtension(sanitized);
    const maxNameLength = 255 - ext.length - 1;
    const baseName = sanitized.substring(0, sanitized.lastIndexOf("."));
    sanitized = baseName.substring(0, maxNameLength) + (ext ? "." + ext : "");
  }

  return sanitized || "untitled";
}

export function validateFileType(mimeType: string | undefined): boolean {
  if (!mimeType) return false;

  const normalized = mimeType.toLowerCase();
  return ALLOWED_MIME_TYPES.some((type) => type.toLowerCase() === normalized);
}

export function validateFileSize(sizeInBytes: number): boolean {
  return sizeInBytes > 0 && sizeInBytes <= MAX_FILE_SIZE;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export const VALIDATION_ERRORS = {
  INVALID_FILE_TYPE:
    "Invalid file type. Please upload PNG, JPG, WEBP, or SVG images only.",
  FILE_TOO_LARGE: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
  INVALID_FILENAME: "Invalid filename. Please use alphanumeric characters only.",
  DUPLICATE_FILENAME:
    "A background with this filename already exists. Please rename and try again.",
} as const;
