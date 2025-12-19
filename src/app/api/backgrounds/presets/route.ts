import { NextResponse } from "next/server";
import { supabaseDb } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: presets, error } = await supabaseDb
      .from("preset_backgrounds")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[backgrounds/presets] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate public URLs for each preset
    const presetsWithUrls = (presets || []).map((preset: any) => {
      const { data: urlData } = supabaseDb.storage
        .from("preset-backgrounds")
        .getPublicUrl(preset.storage_path);

      const thumbnailUrl = preset.thumbnail_path
        ? supabaseDb.storage.from("preset-backgrounds").getPublicUrl(preset.thumbnail_path).data
            .publicUrl
        : null;

      return {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        category: preset.category,
        tags: preset.tags,
        url: urlData.publicUrl,
        thumbnailUrl,
        createdAt: preset.created_at,
      };
    });

    return NextResponse.json({ presets: presetsWithUrls });
  } catch (error) {
    console.error("[backgrounds/presets] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch preset backgrounds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
