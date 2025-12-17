import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "@/lib/auth/server-session";
import { sanitizeFileExtension, updateUserMetadata } from "@/app/api/brand/utils";

export async function POST(request: Request) {
  const session = await getServerSession(request);
  const userId = session?.session?.user?.id ?? session?.user?.id;
  if (!userId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[brand/upload-logo] unauthorized, cookies:", request.headers.get("cookie"));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const filename = "name" in fileObj ? fileObj.name : null;
  const extension = sanitizeFileExtension(filename);
  const path = `${userId}/logo-${Date.now()}.${extension}`;

  try {
    const contentType = fileObj.type || (extension === "svg" ? "image/svg+xml" : null);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("brand-logos")
      .upload(path, Buffer.from(await (file as Blob).arrayBuffer()), {
        cacheControl: "3600",
        upsert: false,
        contentType: contentType ?? undefined,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: profileError } = await supabaseAdmin
      .from("brand_profiles")
      .upsert({ user_id: userId, logo_path: path }, { onConflict: "user_id" });
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await updateUserMetadata(userId, {
      onboardingSteps: ["logo_onboarding_completed"],
    });

    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("brand-logos")
      .createSignedUrl(path, 3600);

    return NextResponse.json({
      success: true,
      logoPath: path,
      signedUrl: signedUrlData?.signedUrl ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
