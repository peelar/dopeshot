import { NextResponse } from "next/server";
import invariant from "tiny-invariant";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { isBrandUser } from "@/lib/tier";

export async function GET() {
  try {
    // Verify session
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    invariant(session.userId, "userId must be defined when isAuth is true");
    const userId = session.userId;

    if (!(await isBrandUser(userId))) {
      return NextResponse.json(
        { error: "Upgrade required", message: "Brand features require a Brand tier account." },
        { status: 403 },
      );
    }

    // Get user-scoped database
    const db = await getUserDb(userId);

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

    if (!profile) {
      return NextResponse.json(
        { error: "Brand profile not found" },
        { status: 404 },
      );
    }

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
