import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";

// Get user-scoped Prisma client
// IMPORTANT: userId argument creates cache key - different users get different cached clients
export const getUserDb = cache(async (userId: string) => {
  // Return extended client with user context and authorization
  return prisma.$extends({
    query: {
      brandProfile: {
        async findMany({ args, query }) {
          // Auto-inject user_id filter
          args.where = { ...args.where, userId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async upsert({ args, query }) {
          // For upsert, ensure both where and create use userId
          args.where = { ...args.where, userId };
          if (args.create && typeof args.create === "object") {
            const { user, ...createData } = args.create as any;
            args.create = { ...createData, userId } as any;
          }
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
      },
      generatedAsset: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async create({ args, query }) {
          if (args.data && typeof args.data === "object") {
            const { user, ...createData } = args.data as any;
            args.data = { ...createData, userId } as any;
          }
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
      },
      userMetadata: {
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
        async upsert({ args, query }) {
          args.where = { ...args.where, userId };
          if (args.create && typeof args.create === "object") {
            const { user, ...createData } = args.create as any;
            args.create = { ...createData, userId } as any;
          }
          return query(args);
        },
      },
    },
  });
});

// Specific data access functions with caching
// Cache key includes userId to prevent cross-user data leakage
export const getBrandProfile = cache(async (userId: string) => {
  const db = await getUserDb(userId);
  return db.brandProfile.findUnique({
    where: { userId },
  });
});

export const getUserMetadata = cache(async (userId: string) => {
  const db = await getUserDb(userId);
  return db.userMetadata.findUnique({
    where: { userId },
  });
});

export const getGeneratedAssets = cache(async (userId: string, limit = 50) => {
  const db = await getUserDb(userId);
  return db.generatedAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
});
