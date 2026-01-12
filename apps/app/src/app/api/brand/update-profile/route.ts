import { NextResponse } from "next/server";
import invariant from "tiny-invariant";

import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { isBrandUser } from "@/lib/tier";
import {
  brandColorPaletteSchema,
  brandModeSchema,
  brandPersonalitySchema,
  brandTypographySchema,
  onboardingProgressSchema,
} from "@/lib/types/brand";
import { isBrandUser } from "@/lib/tier";

const BRAND_ONBOARDING_STEP = "brand_profile";

function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "#000000";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return "#000000";
}

function deriveBackgroundAndText(mode: "light" | "dark") {
  return mode === "dark"
    ? { background: "#0A0A0A", text: "#FAFAFA" }
    : { background: "#FFFFFF", text: "#0A0A0A" };
}

type UpdateProfileBody = {
  name?: string | null;
  personality?: string | null;
  color_palette?: string[];
  typography?: Record<string, string>;
  logo_path?: string | null;
  accent?: string | null;
  mode?: string | null;
  onboarding_completed?: boolean | null;
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

    if (!(await isBrandUser(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: UpdateProfileBody = await request.json().catch(() => ({}));

    if (!(await isBrandUser(userId))) {
      return NextResponse.json(
        { error: "Upgrade required", message: "Brand features require a Brand tier account." },
        { status: 403 },
      );
    }

    // Get user-scoped database
    const db = await getUserDb(userId);

    // Build brand profile updates with validation
    const brandUpdates: Partial<{
      name: string | null;
      personality: string | null;
      colorPalette: unknown;
      typography: unknown;
      logoPath: string | null;
    }> = {};

    const wantsDerivedPaletteUpdate =
      ("accent" in body && typeof body.accent === "string") ||
      ("mode" in body && typeof body.mode === "string");

    const currentPalette = wantsDerivedPaletteUpdate
      ? ((
          await db.brandProfile.findUnique({
            where: { userId },
            select: { colorPalette: true },
          })
        )?.colorPalette as Record<string, unknown> | null | undefined)
      : null;

    if ("name" in body) {
      brandUpdates.name = body.name;
    }

    if ("personality" in body) {
      if (body.personality === null) {
        brandUpdates.personality = null;
      } else if (typeof body.personality === "string") {
        brandUpdates.personality = brandPersonalitySchema.parse(
          body.personality,
        );
      }
    }

    if ("color_palette" in body && Array.isArray(body.color_palette)) {
      // Convert array to BrandColorPalette object
      const [primary, secondary, accent, background, text] = body.color_palette;
      const mode = brandModeSchema.parse(
        typeof body.mode === "string"
          ? body.mode
          : typeof currentPalette?.mode === "string"
            ? currentPalette.mode
            : "dark",
      );
      const colorPalette = {
        mode,
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

    if (wantsDerivedPaletteUpdate) {
      const mode = brandModeSchema.parse(
        typeof body.mode === "string"
          ? body.mode
          : typeof currentPalette?.mode === "string"
            ? currentPalette.mode
            : "dark",
      );

      const accent = normalizeHexColor(
        typeof body.accent === "string"
          ? body.accent
          : typeof currentPalette?.accent === "string"
            ? String(currentPalette.accent)
            : "#6366F1",
      );

      const derived = deriveBackgroundAndText(mode);
      const colorPalette = {
        mode,
        primary: accent,
        secondary: accent,
        accent,
        background: derived.background,
        text: derived.text,
      };

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

    if (body.onboarding_completed) {
      const onboardingProgress = onboardingProgressSchema.parse({
        completedSteps: [BRAND_ONBOARDING_STEP],
      });

      await db.userMetadata.upsert({
        where: { userId },
        create: {
          userId,
          onboardingProgress,
        },
        update: {
          onboardingProgress,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
