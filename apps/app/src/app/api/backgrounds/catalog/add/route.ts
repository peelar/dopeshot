import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { getBackgroundAuthContext, supabaseAdmin } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";
import { getUserDb } from "@/lib/data/dal";
import {
  AI_BACKGROUND_BUCKET,
  MAX_BRAND_BACKGROUNDS,
  PERSONAL_BACKGROUND_BUCKET,
} from "@/domain/backgrounds/constants";
import { signPersonalBackground } from "@/domain/backgrounds/background-storage";
import { isBrandUser } from "@/lib/tier";

const guessContentType = (format: string) => {
  const normalized = format.toLowerCase();
  if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
  if (normalized === "png") return "image/png";
  if (normalized === "webp") return "image/webp";
  return "application/octet-stream";
};

export async function POST(request: Request) {
  try {
    const auth = await getBackgroundAuthContext({ requireBranded: true });
    if (!auth.isAuth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.isBranded) {
      return NextResponse.json({ error: "Brand access required" }, { status: 403 });
    }
    const hasBrandAccess = await isBrandUser(auth.userId);
    if (!hasBrandAccess) {
      return NextResponse.json({ error: "Brand tier required" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const catalogId = (body as { catalogId?: string }).catalogId;
    if (!catalogId) {
      return NextResponse.json({ error: "Missing catalogId" }, { status: 400 });
    }

    const db = await getUserDb(auth.userId);

    const existing = await db.personalBackground.findFirst({
      where: {
        sourceType: "catalog",
        sourceId: catalogId,
      },
      select: {
        id: true,
        name: true,
        storagePath: true,
        previewUrl: true,
        fileSizeKb: true,
        widthPx: true,
        heightPx: true,
        fileFormat: true,
        sourceType: true,
        sourceId: true,
      },
    });

    if (existing) {
      const previewPath = existing.previewUrl || existing.storagePath;
      const previewUrl = await signPersonalBackground(previewPath);
      return NextResponse.json({
        id: existing.id,
        name: existing.name,
        previewUrl,
        fileSizeKb: existing.fileSizeKb,
        widthPx: existing.widthPx,
        heightPx: existing.heightPx,
        fileFormat: existing.fileFormat,
        sourceType: existing.sourceType,
        sourceId: existing.sourceId,
      });
    }

    const existingCount = await db.personalBackground.count();
    if (existingCount >= MAX_BRAND_BACKGROUNDS) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_BRAND_BACKGROUNDS} backgrounds. Delete one to add more.` },
        { status: 400 },
      );
    }

    const catalogItem = await prisma.aiBackground.findUnique({
      where: { id: catalogId },
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
      },
    });

    if (!catalogItem || catalogItem.status !== "published") {
      return NextResponse.json({ error: "Catalog item not available" }, { status: 404 });
    }

    const sourcePath = catalogItem.previewUrl || catalogItem.storagePath;
    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from(AI_BACKGROUND_BUCKET)
      .download(sourcePath);

    if (downloadError || !blob) {
      return NextResponse.json({ error: "Failed to download background" }, { status: 500 });
    }

    const fileFormat = catalogItem.fileFormat || "jpg";
    const uploadPath = `${auth.userId}/catalog-${catalogItem.id}-${Date.now()}.${fileFormat}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(PERSONAL_BACKGROUND_BUCKET)
      .upload(uploadPath, Buffer.from(await blob.arrayBuffer()), {
        cacheControl: "3600",
        upsert: false,
        contentType: guessContentType(fileFormat),
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const background = await db.personalBackground.create({
      data: {
        name: `AI ${catalogItem.personality} background`,
        storagePath: uploadPath,
        previewUrl: uploadPath,
        fileSizeKb: catalogItem.fileSizeKb,
        widthPx: catalogItem.widthPx,
        heightPx: catalogItem.heightPx,
        fileFormat: fileFormat,
        sourceType: "catalog",
        sourceId: catalogItem.id,
      },
      select: {
        id: true,
        name: true,
        storagePath: true,
        previewUrl: true,
        fileSizeKb: true,
        widthPx: true,
        heightPx: true,
        fileFormat: true,
        sourceType: true,
        sourceId: true,
      },
    });

    const previewUrl = await signPersonalBackground(background.previewUrl || background.storagePath);

    return NextResponse.json({
      id: background.id,
      name: background.name,
      previewUrl,
      fileSizeKb: background.fileSizeKb,
      widthPx: background.widthPx,
      heightPx: background.heightPx,
      fileFormat: background.fileFormat,
      sourceType: background.sourceType,
      sourceId: background.sourceId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add background";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
