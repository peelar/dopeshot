import type {
  BackgroundSelection,
  PersonalBackground,
  PresetBackground,
} from "./types";

type ListResponse<T> = {
  items: T[];
  userTier?: string | null;
};

type SelectionResponse = BackgroundSelection & {
  userTier?: string | null;
};

type UploadResponse = PersonalBackground & {
  userTier?: string | null;
};

const PRESET_CACHE_TTL_MS = 5 * 60 * 1000;
let presetCache:
  | { data: ListResponse<PresetBackground>; expiresAt: number }
  | null = null;
let presetInFlight: Promise<ListResponse<PresetBackground>> | null = null;

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

export async function listPresetBackgrounds(): Promise<ListResponse<PresetBackground>> {
  const now = Date.now();
  if (presetCache && presetCache.expiresAt > now) {
    return presetCache.data;
  }
  if (presetInFlight) {
    return presetInFlight;
  }

  presetInFlight = (async () => {
    try {
      const response = await fetch("/api/backgrounds/presets", {
        method: "GET",
      });
      const data = await parseResponse<ListResponse<PresetBackground>>(response);
      presetCache = { data, expiresAt: Date.now() + PRESET_CACHE_TTL_MS };
      return data;
    } finally {
      presetInFlight = null;
    }
  })();

  return presetInFlight;
}

export async function listPersonalBackgrounds(): Promise<ListResponse<PersonalBackground>> {
  const response = await fetch("/api/backgrounds/personal", {
    method: "GET",
  });
  return parseResponse<ListResponse<PersonalBackground>>(response);
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
  return parseResponse<UploadResponse>(response);
}

export async function deletePersonalBackground(backgroundId: string): Promise<void> {
  const response = await fetch(`/api/backgrounds/personal/${backgroundId}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    await parseResponse(response);
  }
}
