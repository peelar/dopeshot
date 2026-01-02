import { NextResponse } from "next/server";
import { getUserDb } from "@/lib/data/dal";
import { getBackgroundAuthContext } from "@/lib/supabase-admin";

const ALLOWED_BACKGROUND_TYPES = new Set(["personal"]);

export async function GET() {
  try {
    const auth = await getBackgroundAuthContext();
    if (!auth.isAuth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getUserDb(auth.userId);
    const selection = await db.backgroundSelection.findUnique({
      where: { userId: auth.userId },
      select: {
        backgroundType: true,
        backgroundId: true,
      },
    });

    if (!selection) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({
      backgroundType: selection.backgroundType,
      backgroundId: selection.backgroundId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load selection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await getBackgroundAuthContext();
    if (!auth.isAuth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { backgroundType, backgroundId } = body as {
      backgroundType?: string;
      backgroundId?: string;
    };

    if (!backgroundType || !backgroundId || !ALLOWED_BACKGROUND_TYPES.has(backgroundType)) {
      return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
    }

    const db = await getUserDb(auth.userId);
    const personal = await db.personalBackground.findFirst({
      where: { id: backgroundId },
      select: { id: true },
    });
    if (!personal) {
      return NextResponse.json({ error: "Personal background not found" }, { status: 404 });
    }

    const selection = await db.backgroundSelection.upsert({
      where: { userId: auth.userId },
      create: {
        userId: auth.userId,
        backgroundType,
        backgroundId,
      },
      update: {
        backgroundType,
        backgroundId,
      },
      select: {
        backgroundType: true,
        backgroundId: true,
      },
    });

    return NextResponse.json({
      backgroundType: selection.backgroundType,
      backgroundId: selection.backgroundId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save selection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await getBackgroundAuthContext();
    if (!auth.isAuth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getUserDb(auth.userId);
    await db.backgroundSelection.deleteMany({
      where: { userId: auth.userId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear selection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
