import { NextRequest, NextResponse } from "next/server";
import { getBackgroundAuthContext, supabaseAdmin } from "@/lib/supabase-admin";
import { getUserDb } from "@/lib/data/dal";
import { uploadScreenshot, getSignedUrl } from "@/lib/storage/memory-storage";
import { computeConfigHash } from "@/domain/memory/config-hash";
import type { MemoryConfiguration, MemoryItemDTO } from "@/domain/memory/types";
import { nanoid } from "nanoid";

/**
 * GET /api/memory/items
 * List user's memory items with pagination
 */
export async function GET(request: NextRequest) {
  const authContext = await getBackgroundAuthContext();

  if (!authContext.isAuth || !authContext.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getUserDb(authContext.userId);

    // Get query params for pagination
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50); // Default 10, max 50
    const cursor = searchParams.get("cursor"); // ISO timestamp for cursor-based pagination

    // Build where clause with cursor
    const where: any = { userId: authContext.userId };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    // Fetch memory items for this user (limit + 1 to check if there are more)
    const items = await db.memoryItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      select: {
        id: true,
        screenshotPath: true,
        shareHash: true,
        sharedAt: true,
        createdAt: true,
      },
    });

    // Check if there are more items
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? resultItems[resultItems.length - 1].createdAt.toISOString() : null;

    // Generate signed URLs for thumbnails
    const itemDTOs: MemoryItemDTO[] = await Promise.all(
      resultItems.map(async (item) => {
        const screenshotUrl = await getSignedUrl(item.screenshotPath);
        return {
          id: item.id,
          screenshotUrl,
          isShared: Boolean(item.shareHash),
          shareUrl: item.shareHash
            ? `${request.nextUrl.origin}/${item.shareHash}`
            : null,
          createdAt: item.createdAt.toISOString(),
        };
      }),
    );

    return NextResponse.json({
      items: itemDTOs,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error("Failed to fetch memory items:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory items" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/memory/items
 * Create a new memory item with screenshot upload
 */
export async function POST(request: NextRequest) {
  const authContext = await getBackgroundAuthContext();

  if (!authContext.isAuth || !authContext.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const configJson = formData.get("configuration") as string;
    const screenshotFile = formData.get("screenshot") as File;

    if (!configJson || !screenshotFile) {
      return NextResponse.json(
        { error: "Missing configuration or screenshot" },
        { status: 400 },
      );
    }

    const configuration: MemoryConfiguration = JSON.parse(configJson);
    const configHash = computeConfigHash(configuration);

    const db = await getUserDb(authContext.userId);

    // Check save limit (5 for free tier)
    const currentSaveCount = await db.memoryItem.count({
      where: { userId: authContext.userId },
    });

    const SAVE_LIMIT = 5; // Free tier limit

    if (currentSaveCount >= SAVE_LIMIT) {
      return NextResponse.json(
        {
          error: "Save limit reached",
          message: "Delete a saved design to save this one",
          limit: SAVE_LIMIT,
          current: currentSaveCount,
        },
        { status: 403 }, // Forbidden - quota exceeded
      );
    }

    // Check for duplicate (same configHash for this user)
    const existing = await db.memoryItem.findFirst({
      where: {
        userId: authContext.userId,
        configHash,
      },
    });

    if (existing) {
      // Return existing item instead of creating duplicate
      const screenshotUrl = await getSignedUrl(existing.screenshotPath);
      return NextResponse.json({
        item: {
          id: existing.id,
          screenshotUrl,
          isShared: Boolean(existing.shareHash),
          shareUrl: existing.shareHash
            ? `${request.nextUrl.origin}/${existing.shareHash}`
            : null,
          createdAt: existing.createdAt.toISOString(),
        },
        duplicate: true,
      });
    }

    // Generate new memory item ID
    const memoryItemId = nanoid(8);

    // Upload screenshot to Supabase
    const screenshotBuffer = Buffer.from(await screenshotFile.arrayBuffer());
    const storagePath = await uploadScreenshot(
      authContext.userId,
      memoryItemId,
      screenshotBuffer,
    );

    // Create memory item in database
    const memoryItem = await db.memoryItem.create({
      data: {
        id: memoryItemId,
        userId: authContext.userId,
        configHash,
        screenshotPath: storagePath,
        configuration: configuration as any, // Prisma Json type
      },
    });

    // Generate signed URL for response
    const screenshotUrl = await getSignedUrl(storagePath);

    const itemDTO: MemoryItemDTO = {
      id: memoryItem.id,
      screenshotUrl,
      isShared: false,
      shareUrl: null,
      createdAt: memoryItem.createdAt.toISOString(),
    };

    return NextResponse.json({ item: itemDTO }, { status: 201 });
  } catch (error) {
    console.error("Failed to create memory item:", error);
    return NextResponse.json(
      { error: "Failed to create memory item" },
      { status: 500 },
    );
  }
}
