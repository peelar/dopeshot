import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySession } from "@/lib/auth/session";
import { createBackgroundAsset } from "@/lib/data/dal";
import {
  validateBackgroundFile,
  sanitizeFileExtension,
  generateStoragePath,
  API_ERRORS,
} from "@/app/api/background/utils";
import { sanitizeFilename } from "@/domain/background/validation";

export async function POST(request: Request) {
  try {
    // Verify session
    const session = await verifySession();
    if (!session.isAuth || !session.userId) {
      return NextResponse.json({ error: API_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: API_ERRORS.MISSING_FORM_DATA }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || typeof (file as Blob).arrayBuffer !== "function") {
      return NextResponse.json({ error: API_ERRORS.MISSING_FILE }, { status: 400 });
    }

    const fileObj = file as File;

    // Validate file
    const validation = validateBackgroundFile(fileObj);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Sanitize filename
    const originalFilename = "name" in fileObj ? fileObj.name : "untitled";
    const sanitizedFilename = sanitizeFileExtension(sanitizeFilename(originalFilename));

    // Generate storage path
    const storagePath = generateStoragePath(session.userId, sanitizedFilename);

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("user-backgrounds")
      .upload(storagePath, Buffer.from(await (file as Blob).arrayBuffer()), {
        cacheControl: "3600",
        upsert: false,
        contentType: fileObj.type || undefined,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Create database record
    try {
      const background = await createBackgroundAsset(session.userId, {
        name: sanitizedFilename,
        imagePath: storagePath,
        fileSize: fileObj.size,
      });

      // Generate signed URL
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from("user-backgrounds")
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      return NextResponse.json({
        success: true,
        background: {
          id: background.id,
          userId: background.userId,
          name: background.name,
          imagePath: background.imagePath,
          fileSize: background.fileSize,
          dimensions: background.dimensions,
          createdAt: background.createdAt.toISOString(),
        },
        signedUrl: signedUrlData?.signedUrl ?? null,
      });
    } catch (dbError) {
      // Handle duplicate filename error (P2002 Prisma error code)
      if (
        dbError instanceof Prisma.PrismaClientKnownRequestError &&
        dbError.code === "P2002"
      ) {
        // Delete the uploaded file since DB insert failed
        await supabaseAdmin.storage.from("user-backgrounds").remove([storagePath]);

        return NextResponse.json(
          {
            error: `A background named "${sanitizedFilename}" already exists. Please rename and try again.`,
          },
          { status: 409 }
        );
      }

      // For other DB errors, also clean up uploaded file
      await supabaseAdmin.storage.from("user-backgrounds").remove([storagePath]);
      throw dbError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
