import { NextResponse } from "next/server";
import invariant from "tiny-invariant";
import { WebhookVerificationError, validateEvent } from "@polar-sh/sdk/webhooks";

import { enablePolarBillingFlag } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { requirePolarWebhookSecret } from "@/lib/billing/polar";

export const runtime = "nodejs";

type PolarSubscription = {
  id: string;
  status?: string | null;
  customer_id?: string | null;
  checkout_id?: string | null;
  cancel_at_period_end?: boolean | null;
  current_period_end?: string | null;
  ends_at?: string | null;
  customer?: {
    external_id?: string | null;
    email?: string | null;
  } | null;
  metadata?: Record<string, unknown> | null;
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function deriveTier(params: {
  eventType: string;
  status: string | null;
  cancelAtPeriodEnd: boolean | null;
}): "free" | "brand" {
  const normalizedType = params.eventType.toLowerCase();
  if (normalizedType === "subscription.revoked") return "free";
  if (normalizedType === "subscription.cancelled") return "free";

  switch (params.status) {
    case "active":
    case "trialing":
    case "past_due":
      return "brand";
    case "canceled":
      return params.cancelAtPeriodEnd ? "brand" : "free";
    default:
      return "free";
  }
}

async function resolveUserId(subscription: PolarSubscription): Promise<string | null> {
  const externalId =
    subscription.customer?.external_id ??
    (typeof subscription.metadata?.user_id === "string" ? subscription.metadata.user_id : null);
  if (externalId) return externalId;

  const email = subscription.customer?.email;
  if (!email) return null;

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function POST(request: Request) {
  const enabled = await enablePolarBillingFlag();
  if (!enabled) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const body = Buffer.from(await request.arrayBuffer());
  const headers = Object.fromEntries(request.headers.entries());

  try {
    const secret = requirePolarWebhookSecret();
    const event = validateEvent(body, headers, secret) as { type: string; data: unknown };

    if (!event?.type) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const eventType = String(event.type);
    if (!eventType.toLowerCase().startsWith("subscription.")) {
      return new NextResponse("", { status: 202 });
    }

    const subscription = event.data as PolarSubscription;
    invariant(subscription?.id, "Subscription payload missing id");

    const userId = await resolveUserId(subscription);
    if (!userId) {
      return NextResponse.json({ error: "Unable to resolve user" }, { status: 422 });
    }

    const status = subscription.status ?? null;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? null;
    const tier = deriveTier({ eventType, status, cancelAtPeriodEnd });

    await prisma.userMetadata.upsert({
      where: { userId },
      create: {
        userId,
        subscriptionTier: tier,
        subscriptionStatus: status ?? "active",
        subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
        subscriptionCurrentPeriodEnd: parseDate(subscription.current_period_end),
        subscriptionEndsAt: parseDate(subscription.ends_at),
        polarCustomerId: subscription.customer_id ?? undefined,
        polarSubscriptionId: subscription.id,
      },
      update: {
        subscriptionTier: tier,
        subscriptionStatus: status ?? "active",
        subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
        subscriptionCurrentPeriodEnd: parseDate(subscription.current_period_end),
        subscriptionEndsAt: parseDate(subscription.ends_at),
        polarCustomerId: subscription.customer_id ?? undefined,
        polarSubscriptionId: subscription.id,
      },
    });

    return new NextResponse("", { status: 202 });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return new NextResponse("", { status: 403 });
    }

    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

