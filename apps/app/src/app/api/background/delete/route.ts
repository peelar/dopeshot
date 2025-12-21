import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySession } from "@/lib/auth/session";
import { deleteBackgroundAsset, getUserBackgrounds } from "@/lib/data/dal";
import { API_ERRORS } from "@/app/api/background/utils";

export async function DELETE(request: Request) {
  try {
    // Verify session
    const session = await verifySession();
    if (!session.isAuth || !session.userId) {
      return NextResponse.json({ error: API_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body || !body.backgroundId) {
      return NextResponse.json(
        { error: API_ERRORS.MISSING_BACKGROUND_ID },
        { status: 400 }
      );
    }

    const { backgroundId } = body;

    // Get all user backgrounds to find the one to delete
    const userBackgrounds = await getUserBackgrounds(session.userId);
    const background = userBackgrounds.find((bg) => bg.id === backgroundId);

    if (!background) {
      return NextResponse.json(
        { error: API_ERRORS.BACKGROUND_NOT_FOUND },
        { status: 404 }
      );
    }

    // Delete from Supabase Storage first (idempotent operation)
    const { error: storageError } = await supabaseAdmin.storage
      .from("user-backgrounds")
      .remove([background.imagePath]);

    // Log storage error but don't fail (file might already be deleted)
    if (storageError) {
      console.warn("Storage deletion warning:", storageError.message);
    }

    // Delete from database
    await deleteBackgroundAsset(session.userId, backgroundId);

    return NextResponse.json({
      success: true,
      deleted: {
        id: background.id,
        userId: background.userId,
        name: background.name,
        imagePath: background.imagePath,
        fileSize: background.fileSize,
        createdAt: background.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : API_ERRORS.DELETE_FAILED;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
