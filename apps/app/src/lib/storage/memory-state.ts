/**
 * LocalStorage persistence for memory button progressive disclosure state
 * Stores minimal state to remember if user has exports and when they last viewed
 */

const STORAGE_KEYS = {
  HAS_EXPORTS: "dopeshot_memory_has_exports",
  LAST_VIEWED: "dopeshot_memory_last_viewed",
} as const;

interface MemoryState {
  hasExports: boolean;
  lastViewed: number | null;
}

/**
 * Read memory state from localStorage
 * Returns default values if running on server or if keys don't exist
 */
export function getMemoryState(): MemoryState {
  if (typeof window === "undefined") {
    return { hasExports: false, lastViewed: null };
  }

  try {
    const hasExports = localStorage.getItem(STORAGE_KEYS.HAS_EXPORTS) === "true";
    const lastViewedRaw = localStorage.getItem(STORAGE_KEYS.LAST_VIEWED);
    const lastViewed = lastViewedRaw ? parseInt(lastViewedRaw, 10) : null;

    return { hasExports, lastViewed };
  } catch (error) {
    console.warn("Failed to read memory state from localStorage:", error);
    return { hasExports: false, lastViewed: null };
  }
}

/**
 * Write memory state to localStorage
 * Safely handles server-side rendering
 */
export function setMemoryState(state: Partial<MemoryState>): void {
  if (typeof window === "undefined") return;

  try {
    if (state.hasExports !== undefined) {
      localStorage.setItem(STORAGE_KEYS.HAS_EXPORTS, state.hasExports.toString());
    }
    if (state.lastViewed !== undefined) {
      if (state.lastViewed === null) {
        localStorage.removeItem(STORAGE_KEYS.LAST_VIEWED);
      } else {
        localStorage.setItem(STORAGE_KEYS.LAST_VIEWED, state.lastViewed.toString());
      }
    }
  } catch (error) {
    console.warn("Failed to write memory state to localStorage:", error);
  }
}

/**
 * Clear the memory items cache for a specific user
 * This should be called on logout to prevent stale data on next login
 */
export function clearMemoryItemsCache(userId?: string): void {
  if (typeof window === "undefined") return;

  try {
    if (userId) {
      localStorage.removeItem(`dopeshot-memory-items-${userId}`);
    } else {
      // Clear all memory items caches (fallback when userId not available)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("dopeshot-memory-items-")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  } catch (error) {
    console.warn("Failed to clear memory items cache from localStorage:", error);
  }
}

/**
 * Clear all memory state from localStorage
 * Useful for testing or reset flows
 */
export function clearMemoryState(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.HAS_EXPORTS);
    localStorage.removeItem(STORAGE_KEYS.LAST_VIEWED);
    // Also clear the memory items cache
    clearMemoryItemsCache();
  } catch (error) {
    console.warn("Failed to clear memory state from localStorage:", error);
  }
}
