import "server-only";

import { prisma } from "@/lib/prisma";

export type SubscriptionTier = "free" | "brand";
export type SubscriptionStatus = "active" | "inactive";

const isSubscriptionTier = (value: unknown): value is SubscriptionTier =>
  value === "free" || value === "brand";

const isSubscriptionStatus = (value: unknown): value is SubscriptionStatus =>
  value === "active" || value === "inactive";

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const metadata = await prisma.userMetadata.findUnique({
    where: { userId },
    select: { subscriptionTier: true },
  });

  const tier = metadata?.subscriptionTier;
  return isSubscriptionTier(tier) ? tier : "free";
}

export async function setUserTier(args: {
  userId: string;
  tier: SubscriptionTier;
  status?: SubscriptionStatus;
}) {
  const { userId, tier, status } = args;

  return prisma.userMetadata.upsert({
    where: { userId },
    create: {
      userId,
      subscriptionTier: tier,
      subscriptionStatus: status ?? "active",
    },
    update: {
      subscriptionTier: tier,
      ...(isSubscriptionStatus(status)
        ? { subscriptionStatus: status }
        : {}),
    },
    select: {
      userId: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      updatedAt: true,
    },
  });
}

export async function isBrandUser(userId: string): Promise<boolean> {
  return (await getUserTier(userId)) === "brand";
}
