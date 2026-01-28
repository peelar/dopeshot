import type { BackgroundSelection, PersonalBackground } from "./types";

// Cache personal backgrounds for a short window to avoid repeated fetches
const PERSONAL_BACKGROUNDS_TTL_MS = 5 * 60 * 1000; // 5 minutes
let personalBackgroundsCache: { items: PersonalBackground[]; timestamp: number } | null = null;
let personalBackgroundsPromise: Promise<ListResponse<PersonalBackground>> | null = null;

type ListResponse<T> = {
  items: T[];
};

type SelectionResponse = BackgroundSelection;

type UploadResponse = PersonalBackground;

export class BackgroundApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: string }).error ?? "Request failed")
        : "Request failed";
    throw new BackgroundApiError(message, response.status, payload);
  }
  return payload as T;
}

export async function listPersonalBackgrounds(
  options: { forceRefresh?: boolean } = {},
): Promise<ListResponse<PersonalBackground>> {
  const { forceRefresh = false } = options;
  const now = Date.now();

  // Return warm cache when fresh
  if (
    !forceRefresh &&
    personalBackgroundsCache &&
    now - personalBackgroundsCache.timestamp < PERSONAL_BACKGROUNDS_TTL_MS
  ) {
    return personalBackgroundsCache;
  }

  // Deduplicate concurrent requests
  if (!forceRefresh && personalBackgroundsPromise) {
    return personalBackgroundsPromise;
  }

  personalBackgroundsPromise = fetch("/api/backgrounds/personal", {
    method: "GET",
  })
    .then((response) => parseResponse<ListResponse<PersonalBackground>>(response))
    .then((payload) => {
      personalBackgroundsCache = { items: payload.items, timestamp: Date.now() };
      personalBackgroundsPromise = null;
      return payload;
    })
    .catch((error) => {
      personalBackgroundsPromise = null;
      throw error;
    });

  return personalBackgroundsPromise;
}

export async function getBackgroundSelection(): Promise<SelectionResponse | null> {
  const response = await fetch("/api/backgrounds/selection", {
    method: "GET",
  });
  if (response.status === 204) {
    return null;
  }
  return parseResponse<SelectionResponse>(response);
}

export async function saveBackgroundSelection(
  selection: BackgroundSelection,
): Promise<SelectionResponse> {
  const response = await fetch("/api/backgrounds/selection", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  });
  return parseResponse<SelectionResponse>(response);
}

export async function clearBackgroundSelection(): Promise<void> {
  const response = await fetch("/api/backgrounds/selection", {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    await parseResponse(response);
  }
}

export async function uploadPersonalBackground(options: {
  file: File;
  name?: string;
  widthPx?: number;
  heightPx?: number;
  fileFormat?: string;
}): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", options.file);
  if (options.name) formData.append("name", options.name);
  if (options.widthPx) formData.append("widthPx", String(options.widthPx));
  if (options.heightPx) formData.append("heightPx", String(options.heightPx));
  if (options.fileFormat) formData.append("fileFormat", options.fileFormat);

  const response = await fetch("/api/backgrounds/personal", {
    method: "POST",
    body: formData,
  });
  const payload = await parseResponse<UploadResponse>(response);

  // Update cache with new item (or invalidate if missing)
  if (personalBackgroundsCache) {
    personalBackgroundsCache = {
      items: [payload, ...personalBackgroundsCache.items],
      timestamp: Date.now(),
    };
  } else {
    personalBackgroundsCache = { items: [payload], timestamp: Date.now() };
  }

  return payload;
}

export async function deletePersonalBackground(backgroundId: string): Promise<void> {
  const response = await fetch(`/api/backgrounds/personal/${backgroundId}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    await parseResponse(response);
  }

  // Remove from cache when present
  if (personalBackgroundsCache) {
    personalBackgroundsCache = {
      items: personalBackgroundsCache.items.filter((b) => b.id !== backgroundId),
      timestamp: Date.now(),
    };
  }
}
