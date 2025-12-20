import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";

// Get user-scoped Prisma client
export const getUserDb = cache(async () => {
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    throw new Error("Unauthorized");
  }

  // Return extended client with user context and authorization
  return prisma.$extends({
    query: {
      brandProfile: {
        async findMany({ args, query }) {
          // Auto-inject user_id filter
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async upsert({ args, query }) {
          // For upsert, ensure both where and create use userId
          args.where = { ...args.where, userId: session.userId };
          if (args.create && typeof args.create === "object") {
            const { user, ...createData } = args.create as any;
            args.create = { ...createData, userId: session.userId } as any;
          }
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
      },
      generatedAsset: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async create({ args, query }) {
          if (args.data && typeof args.data === "object") {
            const { user, ...createData } = args.data as any;
            args.data = { ...createData, userId: session.userId } as any;
          }
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
      },
      userMetadata: {
        async findUnique({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          return query(args);
        },
        async upsert({ args, query }) {
          args.where = { ...args.where, userId: session.userId };
          if (args.create && typeof args.create === "object") {
            const { user, ...createData } = args.create as any;
            args.create = { ...createData, userId: session.userId } as any;
          }
          return query(args);
        },
      },
    },
  });
});

// Specific data access functions with caching
export const getBrandProfile = cache(async () => {
  const session = await verifySession();
  if (!session.isAuth || !session.userId) {
    throw new Error("Unauthorized");
  }

  const db = await getUserDb();
  return db.brandProfile.findUnique({
    where: { userId: session.userId },
  });
});

export const getUserMetadata = cache(async () => {
  const session = await verifySession();
  if (!session.isAuth || !session.userId) {
    throw new Error("Unauthorized");
  }

  const db = await getUserDb();
  return db.userMetadata.findUnique({
    where: { userId: session.userId },
  });
});

export const getGeneratedAssets = cache(async (limit = 50) => {
  const db = await getUserDb();
  return db.generatedAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
});
