import { NextRequest, NextResponse } from "next/server";

import { getUserDb } from "@/lib/data/dal";
import { getBackgroundAuthContext, supabaseAdmin } from "@/lib/supabase-admin";
import { PERSONAL_BACKGROUND_BUCKET } from "@/domain/backgrounds/constants";

type Params = {
  params: Promise<{
    backgroundId: string;
  }>;
};

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { backgroundId } = await params;
    const auth = await getBackgroundAuthContext();
    if (!auth.isAuth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getUserDb(auth.userId);
    const background = await db.personalBackground.findFirst({
      where: { id: backgroundId },
      select: { id: true, storagePath: true },
    });

    if (!background) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error: removeError } = await supabaseAdmin.storage
      .from(PERSONAL_BACKGROUND_BUCKET)
      .remove([background.storagePath]);

    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }

    await db.personalBackground.deleteMany({
      where: { id: background.id },
    });

    await db.backgroundSelection.deleteMany({
      where: { backgroundType: "personal", backgroundId: background.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete background";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
