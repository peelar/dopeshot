import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { getUserDb } from "@/lib/data/dal";
import { getBackgroundAuthContext, supabaseAdmin } from "@/lib/supabase-admin";
import {
  ALLOWED_BACKGROUND_FORMATS,
  MAX_BACKGROUND_FILE_SIZE_KB,
  MAX_BRAND_BACKGROUNDS,
  PERSONAL_BACKGROUND_BUCKET,
} from "@/domain/backgrounds/constants";
import { signPersonalBackground } from "@/domain/backgrounds/background-storage";
import { sanitizeFileExtension } from "@/app/api/brand/utils";
import { isBrandUser } from "@/lib/tier";

const parseDimension = (value: FormDataEntryValue | null) => {
  if (!value || typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET() {
  try {
    const auth = await getBackgroundAuthContext();
    if (!auth.isAuth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getUserDb(auth.userId);
    const backgrounds = await db.personalBackground.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        storagePath: true,
        previewUrl: true,
        fileSizeKb: true,
        widthPx: true,
        heightPx: true,
        fileFormat: true,
      },
    });

    const results = await Promise.allSettled(
      backgrounds.map(async (background) => {
        const previewPath = background.previewUrl || background.storagePath;
        const previewUrl = await signPersonalBackground(previewPath);
        return {
          id: background.id,
          name: background.name,
          previewUrl,
          fileSizeKb: background.fileSizeKb,
          widthPx: background.widthPx,
          heightPx: background.heightPx,
          fileFormat: background.fileFormat,
        };
      }),
    );

    // Filter out failed items and log failures
    const items = results
      .filter((result): result is PromiseFulfilledResult<{
        id: string;
        name: string | null;
        previewUrl: string | null;
        fileSizeKb: number;
        widthPx: number;
        heightPx: number;
        fileFormat: string;
      }> => {
        if (result.status === "rejected") {
          console.error("Failed to generate signed URL for background:", result.reason);
          return false;
        }
        return true;
      })
      .map((result) => result.value);

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load backgrounds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getBackgroundAuthContext();
    if (!auth.isAuth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has brand tier access
    const hasBrandAccess = await isBrandUser(auth.userId);
    if (!hasBrandAccess) {
      return NextResponse.json(
        { error: "Custom backgrounds are a Brand feature. Upgrade to unlock." },
        { status: 403 },
      );
    }

    // Check if user has reached the background limit
    const db = await getUserDb(auth.userId);
    const existingCount = await db.personalBackground.count();
    if (existingCount >= MAX_BRAND_BACKGROUNDS) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_BRAND_BACKGROUNDS} backgrounds. Delete one to add more.` },
        { status: 400 },
      );
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Missing form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || typeof (file as Blob).arrayBuffer !== "function") {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const fileObj = file as File;
    const extension = sanitizeFileExtension(fileObj.name);
    const fileFormat =
      (formData.get("fileFormat")?.toString().toLowerCase() ?? extension) || extension;

    if (!ALLOWED_BACKGROUND_FORMATS.includes(fileFormat as (typeof ALLOWED_BACKGROUND_FORMATS)[number])) {
      return NextResponse.json({ error: "Unsupported file format" }, { status: 400 });
    }

    const fileSizeKb = Math.round(fileObj.size / 1024);
    if (fileSizeKb > MAX_BACKGROUND_FILE_SIZE_KB) {
      return NextResponse.json({ error: "File is too large" }, { status: 400 });
    }

    const widthPx = parseDimension(formData.get("widthPx")) ?? 1;
    const heightPx = parseDimension(formData.get("heightPx")) ?? 1;
    const name =
      (formData.get("name")?.toString() ?? fileObj.name ?? "Background").trim() || "Background";

    const path = `${auth.userId}/background-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(PERSONAL_BACKGROUND_BUCKET)
      .upload(path, Buffer.from(await (file as Blob).arrayBuffer()), {
        cacheControl: "3600",
        upsert: false,
        contentType: fileObj.type || undefined,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const background = await db.personalBackground.create({
      data: {
        userId: auth.userId,
        name,
        storagePath: path,
        previewUrl: path,
        fileSizeKb,
        widthPx,
        heightPx,
        fileFormat,
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
      },
    });

    const previewUrl = await signPersonalBackground(background.previewUrl || background.storagePath);

    return NextResponse.json(
      {
        id: background.id,
        name: background.name,
        previewUrl,
        fileSizeKb: background.fileSizeKb,
        widthPx: background.widthPx,
        heightPx: background.heightPx,
        fileFormat: background.fileFormat,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
