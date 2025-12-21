import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySession } from "@/lib/auth/session";
import { getUserBackgrounds, getCuratedBackgrounds } from "@/lib/data/dal";
import type { BackgroundListResponse } from "@/domain/background/types";
import { API_ERRORS } from "@/app/api/background/utils";

export async function GET() {
  try {
    // Check if user is authenticated (optional for this endpoint)
    const session = await verifySession();
    const isAuthenticated = session.isAuth && session.userId;

    // Fetch curated backgrounds (available to all users)
    const curatedBackgrounds = await getCuratedBackgrounds();

    // Generate public URLs for curated backgrounds
    const curatedWithUrls = curatedBackgrounds.map((bg) => {
      const { data } = supabaseAdmin.storage
        .from("curated-backgrounds")
        .getPublicUrl(bg.imagePath);

      return {
        id: bg.id,
        name: bg.name,
        imagePath: bg.imagePath,
        tags: bg.tags,
        isActive: bg.isActive,
        createdAt: bg.createdAt.toISOString(),
        publicUrl: data.publicUrl,
      };
    });

    // Fetch user backgrounds if authenticated
    let userBackgroundsWithUrls: any[] = [];
    if (isAuthenticated) {
      const userBackgrounds = await getUserBackgrounds(session.userId!);

      // Generate signed URLs for user backgrounds (1 hour expiry)
      userBackgroundsWithUrls = await Promise.all(
        userBackgrounds.map(async (bg) => {
          const { data: signedUrlData } = await supabaseAdmin.storage
            .from("user-backgrounds")
            .createSignedUrl(bg.imagePath, 3600);

          return {
            id: bg.id,
            userId: bg.userId,
            name: bg.name,
            imagePath: bg.imagePath,
            fileSize: bg.fileSize,
            dimensions: bg.dimensions,
            createdAt: bg.createdAt.toISOString(),
            signedUrl: signedUrlData?.signedUrl ?? null,
          };
        })
      );
    }

    const response: BackgroundListResponse = {
      user: userBackgroundsWithUrls,
      curated: curatedWithUrls,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : API_ERRORS.FETCH_FAILED;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
