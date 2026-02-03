import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { brandPersonalityValues, type BrandPersonality } from "@/lib/types/brand";
import { signAiBackground } from "@/domain/backgrounds/background-storage";
import { AI_BACKGROUND_BUCKET } from "@/domain/backgrounds/constants";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PERSONALITY_SET = new Set(brandPersonalityValues);
const STATUS_SET = new Set(["pending", "approved", "published", "rejected"]);
const MAX_LIMIT = 60;

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const personalityParam = searchParams.get("personality");

    const limitParam = Number.parseInt(searchParams.get("limit") ?? "24", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "0", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LIMIT) : 24;
    const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    const where: { status?: string; personality?: string } = {};

    if (statusParam && statusParam !== "all") {
      if (!STATUS_SET.has(statusParam)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      where.status = statusParam;
    }

    if (personalityParam && personalityParam !== "all") {
      if (!PERSONALITY_SET.has(personalityParam as BrandPersonality)) {
        return NextResponse.json({ error: "Invalid personality" }, { status: 400 });
      }
      where.personality = personalityParam;
    }

    const backgrounds = await prisma.aiBackground.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        personality: true,
        status: true,
        storagePath: true,
        previewUrl: true,
        fileSizeKb: true,
        widthPx: true,
        heightPx: true,
        fileFormat: true,
        createdAt: true,
      },
    });

    const items = await Promise.all(
      backgrounds.map(async (background) => {
        const previewPath = background.previewUrl || background.storagePath;
        const signedPreview = await signAiBackground(previewPath);
        return {
          id: background.id,
          personality: background.personality,
          status: background.status,
          previewUrl: signedPreview,
          fileSizeKb: background.fileSizeKb,
          widthPx: background.widthPx,
          heightPx: background.heightPx,
          fileFormat: background.fileFormat,
          createdAt: background.createdAt,
        };
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load catalog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { id, status } = body as { id?: string; status?: string };
    if (!id || !status || !STATUS_SET.has(status)) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const updated = await prisma.aiBackground.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        personality: true,
        status: true,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update catalog item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { id } = body as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = await prisma.aiBackground.findUnique({
      where: { id },
      select: { id: true, storagePath: true, previewUrl: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const path = existing.previewUrl || existing.storagePath;
    const { error: removeError } = await supabaseAdmin.storage
      .from(AI_BACKGROUND_BUCKET)
      .remove([path]);

    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }

    await prisma.aiBackground.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete catalog item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
