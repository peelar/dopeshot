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
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Fetch memory items for this user
    const items = await db.memoryItem.findMany({
      where: { userId: authContext.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        screenshotPath: true,
        shareHash: true,
        sharedAt: true,
        createdAt: true,
      },
    });

    // Generate signed URLs for thumbnails
    const itemDTOs: MemoryItemDTO[] = await Promise.all(
      items.map(async (item) => {
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

    return NextResponse.json({ items: itemDTOs });
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
    const memoryItemId = nanoid();

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
