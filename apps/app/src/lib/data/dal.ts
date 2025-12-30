import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { cache } from "react";
import "server-only";

type ScopedArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Array<Record<string, unknown>>;
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
};

const ALLOWED_MODELS = new Set([
  "BrandProfile",
  "UserMetadata",
  "GeneratedAsset",
  "PersonalBackground",
  "BackgroundSelection",
  "MemoryItem",
]);
const GENERATED_ASSET_UNSAFE_OPS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "update",
  "delete",
  "upsert",
]);

const ensureWhereUserId = (args: ScopedArgs, userId: string) => {
  args.where = { ...(args.where ?? {}), userId };
};

const ensureDataUserId = (args: ScopedArgs, userId: string) => {
  if (!args.data) return;

  if (Array.isArray(args.data)) {
    args.data = args.data.map((item) => ({ ...item, userId }));
    return;
  }

  const { user: _user, ...rest } = args.data;
  args.data = { ...rest, userId };
};

const ensureUpsertUserId = (args: ScopedArgs, userId: string) => {
  if (args.create) {
    const { user: _user, ...rest } = args.create;
    args.create = { ...rest, userId };
  }

  if (args.update) {
    const { user: _user, ...rest } = args.update;
    args.update = { ...rest, userId };
  }
};

// Get user-scoped Prisma client
// IMPORTANT: userId argument creates cache key - different users get different cached clients
export const getUserDb = cache(async (userId: string) => {
  return prisma.$extends(
    Prisma.defineExtension({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!ALLOWED_MODELS.has(model)) {
              throw new Error(
                `Unsafe data access: ${model}.${operation} is not permitted via getUserDb()`,
              );
            }

            if (model === "GeneratedAsset" && GENERATED_ASSET_UNSAFE_OPS.has(operation)) {
              throw new Error(
                `Unsafe data access: ${model}.${operation} must be scoped with findFirst/findMany or updateMany/deleteMany`,
              );
            }

            const scopedArgs = args as ScopedArgs;

            if (operation === "create" || operation === "createMany") {
              ensureDataUserId(scopedArgs, userId);
              return query(scopedArgs);
            }

            if (operation === "upsert") {
              ensureWhereUserId(scopedArgs, userId);
              ensureUpsertUserId(scopedArgs, userId);
              return query(scopedArgs);
            }

            if (operation === "update" || operation === "updateMany") {
              ensureWhereUserId(scopedArgs, userId);
              ensureUpsertUserId(scopedArgs, userId);
              return query(scopedArgs);
            }

            if (operation === "delete" || operation === "deleteMany") {
              ensureWhereUserId(scopedArgs, userId);
              return query(scopedArgs);
            }

            ensureWhereUserId(scopedArgs, userId);
            return query(scopedArgs);
          },
        },
      },
    }),
  );
});

// Specific data access functions with caching
// Cache key includes userId to prevent cross-user data leakage
export const getBrandProfile = async (userId: string) => {
  const db = await getUserDb(userId);
  return db.brandProfile.findUnique({
    where: { userId },
  });
};

export const getUserMetadata = async (userId: string) => {
  const db = await getUserDb(userId);
  return db.userMetadata.findUnique({
    where: { userId },
  });
};

export const getGeneratedAssets = async (userId: string, limit = 50) => {
  const db = await getUserDb(userId);
  return db.generatedAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};
