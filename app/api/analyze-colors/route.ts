import { NextRequest, NextResponse } from "next/server";
import { Vibrant } from "node-vibrant/node";

export type ColorPaletteResponse = {
  dominant: string;
  accent: string;
  muted?: string;
  vibrant?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json({ error: "Missing or invalid imageData" }, { status: 400 });
    }

    // Extract base64 data from data URL
    const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "Invalid image data URL format" }, { status: 400 });
    }

    const base64Data = base64Match[1];
    const buffer = Buffer.from(base64Data, "base64");

    // Use node-vibrant to extract color palette
    const palette = await Vibrant.from(buffer).getPalette();

    // Extract colors from palette, with fallbacks
    const dominant = palette.DarkVibrant?.hex ?? palette.Vibrant?.hex ?? "#6366f1";
    const accent = palette.Vibrant?.hex ?? palette.LightVibrant?.hex ?? "#8b5cf6";
    const muted = palette.Muted?.hex ?? palette.DarkMuted?.hex;
    const vibrant = palette.LightVibrant?.hex ?? palette.Vibrant?.hex;

    const response: ColorPaletteResponse = {
      dominant,
      accent,
      ...(muted && { muted }),
      ...(vibrant && { vibrant }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Color analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image colors" },
      { status: 500 },
    );
  }
}

