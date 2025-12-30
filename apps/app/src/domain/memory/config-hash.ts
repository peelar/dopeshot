import { createHash } from "crypto";
import type { MemoryConfiguration } from "./types";

/**
 * Sort object keys recursively for deterministic serialization
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  return Object.keys(obj)
    .sort()
    .reduce(
      (sorted, key) => {
        sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return sorted;
      },
      {} as Record<string, unknown>,
    );
}

/**
 * Generate a deterministic hash for a memory configuration
 * Uses SHA-256 and takes first 32 characters for storage efficiency
 *
 * @param config - Memory configuration object
 * @returns 32-character hex hash
 */
export function computeConfigHash(config: MemoryConfiguration): string {
  const normalized = JSON.stringify(sortKeys(config));
  const hash = createHash("sha256").update(normalized).digest("hex");
  return hash.slice(0, 32);
}
