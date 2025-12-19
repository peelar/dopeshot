import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "@/lib/auth/server-session";

export async function GET(request: Request) {
  const session = await getServerSession(request);
  const userId = session?.session?.user?.id ?? session?.user?.id;
  if (!userId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[brand/profile] unauthorized, cookies:",
        request.headers.get("cookie"),
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("brand_profiles")
      .select("name, color_palette, typography, logo_path")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: metadata } = await supabaseAdmin
      .from("user_metadata")
      .select("onboarding_progress, subscription_tier, subscription_status")
      .eq("user_id", userId)
      .maybeSingle();

    let logoUrl: string | null = null;
    if (profile?.logo_path) {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from("brand-logos")
        .createSignedUrl(profile.logo_path, 3600);
      logoUrl = signedUrlData?.signedUrl ?? null;
    }

    return NextResponse.json({
      profile,
      metadata,
      logoUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
