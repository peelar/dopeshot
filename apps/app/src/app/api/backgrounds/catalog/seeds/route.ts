import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { brandPersonalityValues, type BrandPersonality } from "@/lib/types/brand";
import { appendSeedDiscards } from "@/domain/backgrounds/seed-discards";
import { readSeedManifest, writeSeedManifest } from "@/domain/backgrounds/seed-manifest";

const PERSONALITY_SET = new Set(brandPersonalityValues);

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const personalityParam = searchParams.get("personality");

    if (personalityParam && personalityParam !== "all") {
      if (!PERSONALITY_SET.has(personalityParam as BrandPersonality)) {
        return NextResponse.json({ error: "Invalid personality" }, { status: 400 });
      }
    }

    const manifest = await readSeedManifest();
    const items = manifest.items.filter((item) =>
      personalityParam && personalityParam !== "all"
        ? item.personality === personalityParam
        : true,
    );

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load seeds";
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

    const manifest = await readSeedManifest();
    const { id, ids, all } = body as { id?: string; ids?: string[]; all?: boolean };

    if (all) {
      await appendSeedDiscards(manifest.items);
      await writeSeedManifest({ ...manifest, items: [] });
      return NextResponse.json({ removed: "all" });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const removed = manifest.items.filter((item) => ids.includes(item.id));
      const items = manifest.items.filter((item) => !ids.includes(item.id));
      await appendSeedDiscards(removed);
      await writeSeedManifest({ ...manifest, items });
      return NextResponse.json({ removed: ids.length });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = manifest.items.find((item) => item.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Seed not found" }, { status: 404 });
    }

    await appendSeedDiscards([existing]);
    const items = manifest.items.filter((item) => item.id !== id);
    await writeSeedManifest({ ...manifest, items });

    return NextResponse.json({ removed: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
