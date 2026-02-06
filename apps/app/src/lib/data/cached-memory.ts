"use cache";

import { getUserDb } from "@/lib/data/dal";
import { cacheTag } from "next/cache";

/**
 * Cached function to fetch memory items.
 * Uses the Next.js "use cache" directive to cache the result.
 * Results are scoped by userId, limit, and cursor.
 * Invalidation is handled via the "memory-items-{userId}" tag.
 */
export async function getCachedMemoryItems(
  userId: string,
  limit: number,
  cursor: string | null
) {
  // Add a tag for invalidation
  cacheTag(`memory-items-${userId}`);

  const db = await getUserDb(userId);
  const where: { userId: string; createdAt?: { lt: Date } } = { userId };
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  return db.memoryItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      screenshotPath: true,
      configuration: true,
      shareHash: true,
      sharedAt: true,
      createdAt: true,
    },
  });
}
