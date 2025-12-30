import { NextRequest, NextResponse } from "next/server";
import { getBackgroundAuthContext } from "@/lib/supabase-admin";
import { getUserDb } from "@/lib/data/dal";
import { getSignedUrl } from "@/lib/storage/memory-storage";
import type { MemoryItemFull } from "@/domain/memory/types";

/**
 * GET /api/memory/items/[itemId]
 * Get full memory item with configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const authContext = await getBackgroundAuthContext();

  if (!authContext.isAuth || !authContext.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const db = await getUserDb(authContext.userId);

    // Fetch memory item - ensure it belongs to this user
    const item = await db.memoryItem.findFirst({
      where: {
        id: itemId,
        userId: authContext.userId,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Generate signed URL
    const screenshotUrl = await getSignedUrl(item.screenshotPath);

    const itemFull: MemoryItemFull = {
      id: item.id,
      screenshotUrl,
      isShared: Boolean(item.shareHash),
      shareUrl: item.shareHash
        ? `${request.nextUrl.origin}/${item.shareHash}`
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
