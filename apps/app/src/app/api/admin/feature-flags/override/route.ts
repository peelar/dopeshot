import { NextResponse, type NextRequest } from "next/server";

import { setUserFeatureFlagOverride } from "@/lib/feature-flags";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1] ?? null
    : null;

  if (!process.env.FEATURE_FLAG_ADMIN_TOKEN) {
    return NextResponse.json(
      { error: "Feature flag admin token not configured" },
      { status: 500 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, key, value } = (payload ?? {}) as Record<string, unknown>;

  if (typeof userId !== "string" || typeof key !== "string" || typeof value !== "boolean") {
    return NextResponse.json(
      { error: "userId, key, and boolean value are required" },
      { status: 400 },
    );
  }

  try {
    const flags = await setUserFeatureFlagOverride(adminToken, userId, key, value);
    return NextResponse.json({ success: true, featureFlags: flags });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update flag";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
