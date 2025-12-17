import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "@/lib/auth/server-session";
import { updateUserMetadata } from "@/app/api/brand/utils";

type UpdateProfileBody = {
  name?: string | null;
  color_palette?: string[];
  typography?: Record<string, string>;
  logo_path?: string | null;
  onboardingStep?: string;
  onboardingSteps?: string[];
  subscription_tier?: string;
  subscription_status?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession(request);
  const userId = session?.session?.user?.id ?? session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: UpdateProfileBody = await request.json().catch(() => ({}));

  const brandUpdates: Partial<{
    name: string | null;
    color_palette: string[];
    typography: Record<string, string>;
    logo_path: string | null;
  }> = {};
  if ("name" in body) {
    brandUpdates.name = body.name;
  }
  if ("color_palette" in body && Array.isArray(body.color_palette)) {
    brandUpdates.color_palette = body.color_palette;
  }
  if ("typography" in body && typeof body.typography === "object") {
    brandUpdates.typography = body.typography;
  }
  if ("logo_path" in body) {
    brandUpdates.logo_path = body.logo_path;
  }

  try {
    if (Object.keys(brandUpdates).length) {
      const { error } = await supabaseAdmin
        .from("brand_profiles")
        .upsert({ user_id: userId, ...brandUpdates }, { onConflict: "user_id" });
      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status || 500 },
        );
      }
    }

    const onboardingSteps = [
      ...(Array.isArray(body.onboardingSteps) ? body.onboardingSteps : []),
      ...(body.onboardingStep ? [body.onboardingStep] : []),
    ];

    await updateUserMetadata(userId, {
      onboardingSteps,
      subscriptionTier: body.subscription_tier,
      subscriptionStatus: body.subscription_status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
