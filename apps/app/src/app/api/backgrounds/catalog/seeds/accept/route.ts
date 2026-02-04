import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { AI_BACKGROUND_BUCKET, ALLOWED_BACKGROUND_FORMATS } from "@/domain/backgrounds/constants";
import { readSeedManifest, writeSeedManifest } from "@/domain/backgrounds/seed-manifest";

function formatFromContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  if (contentType.includes("image/png")) return "png";
  if (contentType.includes("image/jpeg") || contentType.includes("image/jpg")) return "jpg";
  if (contentType.includes("image/webp")) return "webp";
  return null;
}

function formatFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const ext = parsed.pathname.split(".").pop()?.toLowerCase();
    if (!ext) return null;
    if (ALLOWED_BACKGROUND_FORMATS.includes(ext as (typeof ALLOWED_BACKGROUND_FORMATS)[number])) {
      return ext;
    }
    if (ext === "jpeg") return "jpg";
    return null;
  } catch {
    return null;
  }
}

function contentTypeFromFormat(format: string) {
  if (format === "jpg") return "image/jpeg";
  return `image/${format}`;
}

export async function POST(request: Request) {
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

    const manifest = await readSeedManifest();
    const item = manifest.items.find((entry) => entry.id === id);
    if (!item) {
      return NextResponse.json({ error: "Seed not found" }, { status: 404 });
    }

    const response = await fetch(item.imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to download seed image" }, { status: 502 });
    }

    const rawContentType = response.headers.get("content-type");
    const contentType =
      rawContentType && rawContentType.includes("application/octet-stream")
        ? null
        : rawContentType;
    const format =
      formatFromContentType(contentType) ??
      formatFromUrl(item.imageUrl) ??
      "jpg";

    if (!ALLOWED_BACKGROUND_FORMATS.includes(format as (typeof ALLOWED_BACKGROUND_FORMATS)[number])) {
      return NextResponse.json({ error: "Unsupported image format" }, { status: 400 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileSizeKb = Math.ceil(buffer.byteLength / 1024);

    const storagePath = `seeded/${item.personality}/${item.id}-${Date.now()}.${format}`;
    const primaryContentType = contentType ?? contentTypeFromFormat(format);
    const uploadWithType = async (type: string) => {
      const { error } = await supabaseAdmin.storage
        .from(AI_BACKGROUND_BUCKET)
        .upload(storagePath, buffer, {
          contentType: type,
          upsert: false,
        });
      return error;
    };

    let uploadError = await uploadWithType(primaryContentType);
    if (
      uploadError &&
      format === "jpg" &&
      primaryContentType !== "image/jpg" &&
      uploadError.message.toLowerCase().includes("mime type")
    ) {
      uploadError = await uploadWithType("image/jpg");
    }

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const created = await prisma.aiBackground.create({
      data: {
        personality: item.personality,
        status: "published",
        provider: item.provider ?? "replicate",
        model: item.model ?? "unknown",
        prompt: item.prompt ?? null,
        seed: item.seed ?? null,
        storagePath,
        previewUrl: storagePath,
        fileSizeKb,
        widthPx: Number.isFinite(item.widthPx) ? item.widthPx : 1920,
        heightPx: Number.isFinite(item.heightPx) ? item.heightPx : 1080,
        fileFormat: format,
      },
      select: {
        id: true,
        personality: true,
        status: true,
      },
    });

    const remaining = manifest.items.filter((entry) => entry.id !== id);
    await writeSeedManifest({ ...manifest, items: remaining });

    return NextResponse.json({ item: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
