export function sanitizeFileExtension(filename: string | null | undefined) {
  if (!filename) return "png";
  const parts = filename.split(".").filter(Boolean);
  const extension = parts.length ? parts.at(-1) : null;
  if (!extension) return "png";
  return extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
}
