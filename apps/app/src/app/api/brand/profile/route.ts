import { NextResponse } from "next/server";
import invariant from "tiny-invariant";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";

function isTruthyObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveIsBrandUser(featureFlags: unknown): boolean {
  if (!isTruthyObject(featureFlags)) return false;

  const flagValue = (key: string) => featureFlags[key];

  return (
    flagValue("tier.brand") === true ||
    flagValue("tier.brand_user") === true ||
    flagValue("brand") === true ||
    flagValue("isBrandUser") === true
  );
}

export async function GET() {
  try {
    // Verify session
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    invariant(session.userId, "userId must be defined when isAuth is true");
    const userId = session.userId;

    // Get user-scoped database
    const db = await getUserDb(userId);
    const metadata = await db.userMetadata.findUnique({
      where: { userId },
      select: { featureFlags: true },
    });

    if (!resolveIsBrandUser(metadata?.featureFlags)) {
      return NextResponse.json(
        { error: "Upgrade required", message: "Brand features require a Brand tier account." },
        { status: 403 },
      );
    }

    // Fetch brand profile via Prisma
    const profile = await db.brandProfile.findUnique({
      where: { userId },
      select: {
        name: true,
        personality: true,
        colorPalette: true,
        typography: true,
        logoPath: true,
      },
    });

    // Generate signed URL for logo (Supabase Storage unchanged)
    let logoUrl: string | null = null;
    if (profile?.logoPath) {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from("brand-logos")
        .createSignedUrl(profile.logoPath, 3600);
      logoUrl = signedUrlData?.signedUrl ?? null;
    }

    return NextResponse.json({
      profile,
      logoUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
