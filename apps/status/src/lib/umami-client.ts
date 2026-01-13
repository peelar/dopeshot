export type UmamiRequestConfig = {
  url: string;
  headers: Record<string, string>;
};

const CLOUD_BASE_URL = "https://api.umami.is/v1";

export function buildUmamiStatsRequest(options: {
  apiKey: string;
  websiteId: string;
  startAt: number;
  endAt: number;
}): UmamiRequestConfig {
  const { apiKey, websiteId, startAt, endAt } = options;
  const path = `websites/${websiteId}/stats`;
  const url = new URL(path, `${CLOUD_BASE_URL}/`);
  url.searchParams.set("startAt", startAt.toString());
  url.searchParams.set("endAt", endAt.toString());

  const headers: Record<string, string> = {
    "x-umami-api-key": apiKey,
    Accept: "application/json",
  };

  return { url: url.toString(), headers };
}
