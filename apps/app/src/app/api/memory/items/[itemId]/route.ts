import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { getSignedUrl, deleteScreenshot } from "@/lib/storage/memory-storage";
import type { MemoryItemFull } from "@/domain/memory/types";
import { revalidateTag } from "next/cache";
import { buildSharePath } from "@/lib/memory/memory-url";

/**
 * GET /api/memory/items/[itemId]
 * Get full memory item with configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  // Use verifySession directly to avoid overhead of fetching brand profile
  // which getBackgroundAuthContext does by default
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const db = await getUserDb(session.userId);

    // Optimistic path derivation to allow parallel fetching
    const derivedScreenshotPath = `${session.userId}/${itemId}.png`;

    // Fetch memory item and generate signed URL in parallel
    const [item, eagerScreenshotUrl] = await Promise.all([
      db.memoryItem.findFirst({
        where: {
          id: itemId,
          userId: session.userId,
        },
        select: {
          id: true,
          screenshotPath: true,
          shareHash: true,
          createdAt: true,
          configuration: true,
        },
      }),
      // Fire off signed URL generation assuming standard path
      getSignedUrl(derivedScreenshotPath).catch((err) => {
        // Only log unexpected errors, not "Object not found" which is common for jpgs or missing files
        if (err.message && !err.message.includes("Object not found")) {
          console.warn("Optimistic signed URL generation failed:", err);
        }
        return null;
      }),
    ]);

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify we have a valid URL and the path matches
    let screenshotUrl = eagerScreenshotUrl;

    // If path mismatch or eager fetch failed, fall back to sequential fetch
    if (item.screenshotPath !== derivedScreenshotPath || !screenshotUrl) {
      screenshotUrl = await getSignedUrl(item.screenshotPath);
    }

    const itemFull: MemoryItemFull = {
      id: item.id,
      screenshotUrl: screenshotUrl!,
      isShared: Boolean(item.shareHash),
      shareUrl: item.shareHash
        ? `${request.nextUrl.origin}${buildSharePath(item.shareHash)}`
        : null,
      createdAt: item.createdAt.toISOString(),
      configuration: item.configuration as any, // Prisma Json type
    };

    return NextResponse.json({ item: itemFull });
  } catch (error) {
    console.error("Failed to fetch memory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory item" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/memory/items/[itemId]
 * Delete a memory item and its associated screenshot
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  // Use verifySession here too for consistency and speed
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const db = await getUserDb(session.userId);

    // Fetch item to get screenshot path (for storage deletion)
    const item = await db.memoryItem.findFirst({
      where: {
        id: itemId,
        userId: session.userId,
      },
      select: {
        screenshotPath: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete from database first
    await db.memoryItem.delete({
      where: { id: itemId },
    });

    // Invalidate cache for this user's memory items
    revalidateTag(`memory-items-${session.userId}`, "default");

    // Delete from storage (non-blocking, log errors)
    try {
      await deleteScreenshot(item.screenshotPath);
    } catch (storageError) {
      console.error("Failed to delete screenshot from storage:", storageError);
      // Don't fail the request - database delete succeeded
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete memory item:", error);
    return NextResponse.json(
      { error: "Failed to delete memory item" },
      { status: 500 },
    );
  }
}
