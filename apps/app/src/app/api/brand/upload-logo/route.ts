import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import {
  sanitizeFileExtension,
  updateUserMetadata,
} from "@/app/api/brand/utils";
import { compressImageBuffer } from "@/lib/image-compression";

export async function POST(request: Request) {
  try {
    // Verify session
    const session = await verifySession();
    if (!session.isAuth || !session.userId) {
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
    const path = `${session.userId}/logo-${Date.now()}.${extension}`;

    const contentType =
      fileObj.type || (extension === "svg" ? "image/svg+xml" : null);

    // Get file buffer
    const originalBuffer = Buffer.from(await (file as Blob).arrayBuffer());

    // Compress image if needed (skip SVG files)
    let uploadBuffer = originalBuffer;
    if (extension !== "svg") {
      const compressionResult = await compressImageBuffer(originalBuffer, 5120); // 5MB limit
      uploadBuffer = compressionResult.buffer;
    }

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("brand-logos")
      .upload(path, uploadBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: contentType ?? undefined,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get user-scoped database
    const db = await getUserDb(session.userId);

    // Update brand profile with logo path via Prisma
    await db.brandProfile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        logoPath: path,
      },
      update: {
        logoPath: path,
      },
    });

    // Update user metadata with onboarding progress
    await updateUserMetadata({
      onboardingSteps: ["logo_onboarding_completed"],
      session,
    });

    // Generate signed URL (Supabase Storage unchanged)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from("brand-logos")
      .createSignedUrl(path, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Failed to generate signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Logo uploaded but failed to generate preview URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logoPath: path,
      signedUrl: signedUrlData.signedUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
