import { NextResponse } from "next/server";

import { getBackgroundAuthContext } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";
import { brandPersonalityValues, type BrandPersonality } from "@/lib/types/brand";
import { signAiBackground } from "@/domain/backgrounds/background-storage";
import { isBrandUser } from "@/lib/tier";

const PERSONALITY_SET = new Set(brandPersonalityValues);
const MAX_LIMIT = 24;

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const personality = searchParams.get("personality");
    if (!personality || !PERSONALITY_SET.has(personality as BrandPersonality)) {
      return NextResponse.json({ error: "Invalid personality" }, { status: 400 });
    }

    const limitParam = Number.parseInt(searchParams.get("limit") ?? "12", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "0", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LIMIT) : 12;
    const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    const backgrounds = await prisma.aiBackground.findMany({
      where: { personality, status: "published" },
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
      },
    });

    const results = await Promise.allSettled(
      backgrounds.map(async (background) => {
        const previewPath = background.previewUrl || background.storagePath;
        const signedPreview = await signAiBackground(previewPath);
        return {
          id: background.id,
          personality: background.personality,
          status: background.status as "published",
          previewUrl: signedPreview,
          fileSizeKb: background.fileSizeKb,
          widthPx: background.widthPx,
          heightPx: background.heightPx,
          fileFormat: background.fileFormat,
        };
      }),
    );

    const items = results
      .filter((result): result is PromiseFulfilledResult<{
        id: string;
        personality: string;
        status: "published";
        previewUrl: string | null;
        fileSizeKb: number;
        widthPx: number;
        heightPx: number;
        fileFormat: string;
      }> => {
        if (result.status === "rejected") {
          console.error("Failed to sign AI background:", result.reason);
          return false;
        }
        return true;
      })
      .map((result) => result.value);

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load AI backgrounds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
