import { NextResponse } from "next/server";
import consola from "consola";
import { prisma } from "@/lib/prisma";
import { signPresetBackground } from "@/domain/backgrounds/background-storage";

export async function GET() {
  try {
    consola.info("[backgrounds.presets] Fetching presets");
    const presets = await prisma.presetBackground.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        storagePath: true,
        previewUrl: true,
        sortOrder: true,
      },
    });

    consola.info("[backgrounds.presets] Found presets", {
      count: presets.length,
      ids: presets.map((preset) => preset.id),
    });

    const items = await Promise.all(
      presets.map(async (preset) => {
        const previewPath = preset.previewUrl || preset.storagePath;
        const previewUrl = await signPresetBackground(previewPath);
        return {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          previewUrl,
          sortOrder: preset.sortOrder,
        };
      }),
    );

    consola.info("[backgrounds.presets] Signed presets", {
      count: items.length,
      missingPreview: items.filter((item) => !item.previewUrl).map((item) => item.id),
    });

    return NextResponse.json({ items, userTier: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load presets";
    consola.error("[backgrounds.presets] Failed to load presets", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
