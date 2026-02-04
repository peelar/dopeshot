import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";
import { enablePolarBillingFlag } from "@/lib/feature-flags";

type BillingPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const enabled = await enablePolarBillingFlag();
  if (!enabled) notFound();

  const session = await verifySession();
  if (!session.isAuth || !session.userId) {
    redirect("/auth");
  }

  const db = await getUserDb(session.userId);
  const metadata = await db.userMetadata.findUnique({
    where: { userId: session.userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionEndsAt: true,
    },
  });

  const tier = metadata?.subscriptionTier === "brand" ? "brand" : "free";
  const status = metadata?.subscriptionStatus ?? null;
  const cancelAtPeriodEnd = metadata?.subscriptionCancelAtPeriodEnd ?? null;
  const currentPeriodEnd = metadata?.subscriptionCurrentPeriodEnd ?? null;
  const endsAt = metadata?.subscriptionEndsAt ?? null;

  const checkoutStatus = searchParams?.checkout;
  const showSuccessHint = checkoutStatus === "success";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-4 py-12 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-30 dark:opacity-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="absolute left-0 right-0 top-0 z-10 flex h-14 items-center justify-between px-4 sm:px-6">
        <a
          href="/"
          aria-label="Go to homepage"
          className="pl-4 transition-opacity hover:opacity-80"
        >
          <Logo />
        </a>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Back to app
        </Link>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl pt-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your plan and subscription.
          </p>
        </div>

        {showSuccessHint ? (
          <div className="mb-4 rounded-xl border border-border bg-background/60 p-4 text-sm">
            Thanks — checkout completed. If your plan hasn&apos;t updated yet, give it a moment and refresh.
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-background/60 p-6 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground">Current plan</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg font-semibold">{tier === "brand" ? "Brand" : "Free"}</p>
                {status ? (
                  <span className="rounded-full border border-border bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground">
                    {status}
                  </span>
                ) : null}
              </div>
              {currentPeriodEnd ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Renews on {currentPeriodEnd.toLocaleDateString()}
                </p>
              ) : null}
              {endsAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ends on {endsAt.toLocaleDateString()}
                </p>
              ) : null}
              {cancelAtPeriodEnd ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Cancellation scheduled for period end.
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {tier === "brand" ? (
                <Link
                  href="/api/billing/polar/portal?returnTo=%2Fbilling"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Manage
                </Link>
              ) : (
                <Link
                  href="/api/billing/polar/checkout?returnTo=%2Fbilling"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Upgrade to Brand
                </Link>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
            <p>
              Billing is powered by Polar. You&apos;ll be redirected to checkout and returned here after payment.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
