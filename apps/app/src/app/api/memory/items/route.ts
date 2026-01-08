import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { uploadScreenshot, getSignedUrl } from "@/lib/storage/memory-storage";
import { computeConfigHash } from "@/domain/memory/config-hash";
import { SAVE_LIMIT } from "@/domain/memory/constants";
import type { MemoryConfiguration, MemoryItemDTO } from "@/domain/memory/types";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { getCachedMemoryItems } from "@/lib/data/cached-memory";

/**
 * GET /api/memory/items
 * List user's memory items with pagination
 */
export async function GET(request: NextRequest) {
  // Optimization: Use verifySession directly
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get query params for pagination
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50); // Default 10, max 50
    const cursor = searchParams.get("cursor"); // ISO timestamp for cursor-based pagination

    // Fetch cached memory items
    const items = await getCachedMemoryItems(session.userId, limit, cursor);

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
 *
 * Optimized for speed:
 * 1. Parallel limit check + duplicate check
 * 2. Parallel DB create + storage upload + signed URL generation
 */
export async function POST(request: NextRequest) {
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse form data and prepare config hash in parallel with getting DB
    const [formData, db] = await Promise.all([
      request.formData(),
      getUserDb(session.userId),
    ]);

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

    // Parallel: Check save limit AND check for duplicate
    const [currentSaveCount, existing] = await Promise.all([
      db.memoryItem.count({
        where: { userId: session.userId },
      }),
      db.memoryItem.findFirst({
        where: {
          userId: session.userId,
          configHash,
        },
        select: {
          id: true,
          screenshotPath: true,
          shareHash: true,
          createdAt: true,
        },
      }),
    ]);

    if (currentSaveCount >= SAVE_LIMIT) {
      return NextResponse.json(
        {
          error: "Save limit reached",
          message: "Delete a saved design to save this one",
          limit: SAVE_LIMIT,
          current: currentSaveCount,
        },
        { status: 403 },
      );
    }

    if (existing) {
      // Return existing item - generate signed URL
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

    // Generate IDs and determine content type
    const memoryItemId = nanoid(8);
    const contentType = screenshotFile.type === "image/jpeg" ? "image/jpeg" : "image/png";
    const extension = contentType === "image/jpeg" ? "jpg" : "png";
    const storagePath = `${session.userId}/${memoryItemId}.${extension}`;

    // Convert file to buffer (needed for upload)
    const screenshotBuffer = Buffer.from(await screenshotFile.arrayBuffer());

    // Execute DB create + storage upload in parallel
    const [memoryItem] = await Promise.all([
      db.memoryItem.create({
        data: {
          id: memoryItemId,
          userId: session.userId,
          configHash,
          screenshotPath: storagePath,
          configuration: configuration as any,
        },
        select: {
          id: true,
          createdAt: true,
        },
      }),
      uploadScreenshot(session.userId, memoryItemId, screenshotBuffer, contentType),
    ]);

    // Invalidate cache for this user's memory items
    revalidateTag(`memory-items-${session.userId}`, "default");

    // Generate signed URL after upload completes
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