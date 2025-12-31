import "server-only";

import { getUserDb } from "@/lib/data/dal";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";

export const SHOW_BRAND_EXPERIENCE_FLAG = "features.show-brand-experience";

type FeatureFlagMap = Record<string, boolean>;

const isFeatureFlagMap = (value: unknown): value is FeatureFlagMap =>
  Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.values(value as Record<string, unknown>).every((entry) =>
        typeof entry === "boolean",
      ),
  );

const getUserOverride = (flags: unknown, key: string) => {
  if (!flags || !isFeatureFlagMap(flags)) return undefined;
  const override = flags[key];
  return typeof override === "boolean" ? override : undefined;
};

const hashToPercentage = (input: string) => {
  const hash = createHash("sha256").update(input).digest("hex");
  const bucket = Number.parseInt(hash.slice(0, 8), 16);
  return bucket % 100;
};

export async function isFeatureEnabled(userId: string | null, key: string) {
  const [config, userMetadata] = await Promise.all([
    prisma.featureFlagConfig.findUnique({
      where: { key },
      select: {
        defaultValue: true,
        rolloutPercentage: true,
        enabled: true,
      },
    }),
    userId
      ? (async () => {
          const db = await getUserDb(userId);
          return db.userMetadata.findUnique({
            where: { userId },
            select: { featureFlags: true },
          });
        })()
      : null,
  ]);

  const userOverride = getUserOverride(userMetadata?.featureFlags, key);
  if (userOverride !== undefined) {
    return userOverride;
  }

  if (config?.enabled === false) {
    return false;
  }

  if (userId && config && config.rolloutPercentage > 0) {
    const bucket = hashToPercentage(`${userId}:${key}`);
    if (bucket < config.rolloutPercentage) {
      return true;
    }
  }

  if (config) {
    return config.defaultValue;
  }

  // Unknown flag defaults to disabled
  return false;
}

export async function setUserFeatureFlagOverride(
  adminToken: string | null,
  userId: string,
  key: string,
  value: boolean,
) {
  if (!adminToken) {
    throw new Error("Admin token is required to set feature flag overrides.");
  }

  const expectedToken = process.env.FEATURE_FLAG_ADMIN_TOKEN;
  if (!expectedToken || adminToken !== expectedToken) {
    throw new Error("Unauthorized: invalid admin token.");
  }

  const existing = await prisma.userMetadata.findUnique({
    where: { userId },
    select: { featureFlags: true },
  });

  const normalizedFlags: FeatureFlagMap = isFeatureFlagMap(existing?.featureFlags)
    ? existing!.featureFlags
    : {};

  const updatedFlags = { ...normalizedFlags, [key]: value } satisfies FeatureFlagMap;

  await prisma.userMetadata.upsert({
    where: { userId },
    create: {
      userId,
      featureFlags: updatedFlags,
    },
    update: {
      featureFlags: updatedFlags,
    },
  });

  return updatedFlags;
}
