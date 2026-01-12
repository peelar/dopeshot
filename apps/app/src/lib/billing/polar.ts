import "server-only";

import invariant from "tiny-invariant";

export type PolarApiEnv = "production" | "sandbox";

export function getPolarApiBaseUrl(): string {
  if (process.env.POLAR_API_BASE_URL) return process.env.POLAR_API_BASE_URL;

  const env = (process.env.POLAR_ENV as PolarApiEnv | undefined) ?? "production";
  return env === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";
}

export function requirePolarAccessToken(): string {
  const token = process.env.POLAR_ACCESS_TOKEN;
  invariant(token, "POLAR_ACCESS_TOKEN must be configured");
  return token;
}

export function requirePolarProductId(): string {
  const productId = process.env.POLAR_PRODUCT_ID;
  invariant(productId, "POLAR_PRODUCT_ID must be configured");
  return productId;
}

export function requirePolarWebhookSecret(): string {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  invariant(secret, "POLAR_WEBHOOK_SECRET must be configured");
  return secret;
}

export function getAppBaseUrlFromRequest(request: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}

export async function polarApiFetch<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> } = {},
): Promise<T> {
  const url = `${getPolarApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = requirePolarAccessToken();

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Polar API error (${response.status} ${response.statusText}): ${errorText || "No body"}`,
    );
  }

  return (await response.json()) as T;
}

