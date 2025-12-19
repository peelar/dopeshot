import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

// GET - Fetch user's brand backgrounds
export async function GET(request: Request) {
  const session = await getServerSession(request);
  const userId = session?.session?.user?.id ?? session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: backgrounds, error } = await supabaseAdmin
      .from("brand_backgrounds")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[backgrounds/brand] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate public URLs for each background
    const backgroundsWithUrls = (backgrounds || []).map((bg: any) => {
      const { data: urlData } = supabaseAdmin.storage
        .from("brand-backgrounds")
        .getPublicUrl(bg.storage_path);

      const thumbnailUrl = bg.thumbnail_path
        ? supabaseAdmin.storage.from("brand-backgrounds").getPublicUrl(bg.thumbnail_path).data
            .publicUrl
        : null;

      return {
        id: bg.id,
        name: bg.name,
        url: urlData.publicUrl,
        thumbnailUrl,
        fileSize: bg.file_size,
        mimeType: bg.mime_type,
        createdAt: bg.created_at,
      };
    });

    return NextResponse.json({ backgrounds: backgroundsWithUrls });
  } catch (error) {
    console.error("[backgrounds/brand] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch brand backgrounds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Upload a new brand background
export async function POST(request: Request) {
  const session = await getServerSession(request);
  const userId = session?.session?.user?.id ?? session?.user?.id;

  if (!userId) {
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
  const filename = "name" in fileObj ? fileObj.name : `background-${Date.now()}`;
  const name = formData.get("name")?.toString() || filename;

  // Determine file extension
  const extension = getFileExtension(filename);
  const storagePath = `${userId}/background-${Date.now()}.${extension}`;

  try {
    const contentType = fileObj.type || getContentType(extension);
    const arrayBuffer = await (file as Blob).arrayBuffer();
    const fileSize = arrayBuffer.byteLength;

    // Upload to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("brand-backgrounds")
      .upload(storagePath, Buffer.from(arrayBuffer), {
        cacheControl: "3600",
        upsert: false,
        contentType: contentType ?? undefined,
      });

    if (uploadError) {
      console.error("[backgrounds/brand] Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert database record
    const { data: background, error: dbError } = await supabaseAdmin
      .from("brand_backgrounds")
      .insert({
        user_id: userId,
        name,
        storage_path: storagePath,
        file_size: fileSize,
        mime_type: contentType || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[backgrounds/brand] Database error:", dbError);
      // Try to cleanup uploaded file
      await supabaseAdmin.storage.from("brand-backgrounds").remove([storagePath]);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Generate public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("brand-backgrounds")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      background: {
        id: background.id,
        name: background.name,
        url: urlData.publicUrl,
        thumbnailUrl: null,
        fileSize: background.file_size,
        mimeType: background.mime_type,
        createdAt: background.created_at,
      },
    });
  } catch (error) {
    console.error("[backgrounds/brand] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Remove a brand background
export async function DELETE(request: Request) {
  const session = await getServerSession(request);
  const userId = session?.session?.user?.id ?? session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const backgroundId = searchParams.get("id");

  if (!backgroundId) {
    return NextResponse.json({ error: "Background ID is required" }, { status: 400 });
  }

  try {
    // Fetch the background to get storage path
    const { data: background, error: fetchError } = await supabaseAdmin
      .from("brand_backgrounds")
      .select("storage_path, thumbnail_path")
      .eq("id", backgroundId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !background) {
      return NextResponse.json({ error: "Background not found" }, { status: 404 });
    }

    // Delete from storage
    const pathsToDelete = [background.storage_path];
    if (background.thumbnail_path) {
      pathsToDelete.push(background.thumbnail_path);
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from("brand-backgrounds")
      .remove(pathsToDelete);

    if (storageError) {
      console.error("[backgrounds/brand] Storage deletion error:", storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from("brand_backgrounds")
      .delete()
      .eq("id", backgroundId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("[backgrounds/brand] Database deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[backgrounds/brand] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete background";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper functions
function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase();
    // Sanitize extension
    if (ext && /^[a-z0-9]{2,5}$/.test(ext)) {
      return ext;
    }
  }
  return "png";
}

function getContentType(extension: string): string | null {
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return types[extension] || null;
}
