import { NextResponse } from "next/server";
import invariant from "tiny-invariant";

import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import {
  brandColorPaletteSchema,
  brandTypographySchema,
} from "@/lib/types/brand";

type UpdateProfileBody = {
  name?: string | null;
  color_palette?: string[];
  typography?: Record<string, string>;
  logo_path?: string | null;
};

export async function PATCH(request: Request) {
  try {
    // Verify session
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    invariant(session.userId, "userId must be defined when isAuth is true");
    const userId = session.userId;

    const body: UpdateProfileBody = await request.json().catch(() => ({}));

    // Get user-scoped database
    const db = await getUserDb(userId);

    // Build brand profile updates with validation
    const brandUpdates: Partial<{
      name: string | null;
      colorPalette: unknown;
      typography: unknown;
      logoPath: string | null;
    }> = {};

    if ("name" in body) {
      brandUpdates.name = body.name;
    }

    if ("color_palette" in body && Array.isArray(body.color_palette)) {
      // Convert array to BrandColorPalette object
      const [primary, secondary, accent, background, text] = body.color_palette;
      const colorPalette = {
        primary: primary ?? "#000000",
        secondary: secondary ?? "#000000",
        accent: accent ?? "#000000",
        background: background ?? "#FFFFFF",
        text: text ?? "#000000",
      };
      // Validate with Zod schema
      const validated = brandColorPaletteSchema.parse(colorPalette);
      brandUpdates.colorPalette = validated;
    }

    if ("typography" in body && typeof body.typography === "object") {
      // Validate with Zod schema
      const validated = brandTypographySchema.parse(body.typography);
      brandUpdates.typography = validated;
    }

    if ("logo_path" in body) {
      brandUpdates.logoPath = body.logo_path;
    }

    // Update brand profile via Prisma
    if (Object.keys(brandUpdates).length) {
      await db.brandProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...brandUpdates,
        },
        update: brandUpdates,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
