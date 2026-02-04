import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getUserDb } from "@/lib/data/dal";
import { getSignedUrl, copyScreenshot } from "@/lib/storage/memory-storage";
import { computeConfigHash } from "@/domain/memory/config-hash";
import { buildMemoryPath, buildSharePath } from "@/lib/memory/memory-url";
import type { MemoryConfiguration } from "@/domain/memory/types";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    shareHash: string;
  }>;
};

export default async function SharePage({ params }: PageProps) {
  const { shareHash } = await params;
  const session = await verifySession();

  const sharedItem = await prisma.memoryItem.findFirst({
    where: {
      shareHash,
    },
    select: {
      id: true,
      userId: true,
      screenshotPath: true,
      configuration: true,
    },
  });

  if (!sharedItem) {
    redirect("/");
  }

  if (session.isAuth && session.userId) {
    if (session.userId === sharedItem.userId) {
      redirect(buildMemoryPath(sharedItem.id));
    }

    const db = await getUserDb(session.userId);
    const configuration = sharedItem.configuration as MemoryConfiguration;
    const configHash = computeConfigHash(configuration);

    const existing = await db.memoryItem.findFirst({
      where: {
        configHash,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      redirect(buildMemoryPath(existing.id));
    }

    const newItemId = nanoid(8);
    const extension = sharedItem.screenshotPath.split(".").pop() ?? "png";
    const newScreenshotPath = `${session.userId}/${newItemId}.${extension}`;

    await copyScreenshot(sharedItem.screenshotPath, newScreenshotPath);

    await db.memoryItem.create({
      data: {
        id: newItemId,
        configHash,
        screenshotPath: newScreenshotPath,
        configuration: configuration as any,
        shareHash: nanoid(12),
        sharedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    redirect(buildMemoryPath(newItemId));
  }

  const screenshotUrl = await getSignedUrl(sharedItem.screenshotPath);
  const redirectTarget = buildSharePath(shareHash);

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Go to homepage" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <Link
            href={`/auth?redirect=${encodeURIComponent(redirectTarget)}`}
            className="text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            Sign in
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="overflow-hidden rounded-3xl border border-border/40 bg-background shadow-xl">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={screenshotUrl}
                alt="Shared design preview"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 640px, 100vw"
                priority
              />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-5">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Shared design
              </p>
              <h1 className="text-3xl font-semibold text-foreground">
                Preview this design, then save it to use in dopeshot
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign up to save a copy to your workspace. You&#39;ll be able to edit it,
                export it, and share new versions.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="h-12">
                <Link href={`/auth?redirect=${encodeURIComponent(redirectTarget)}`}>
                  Sign up to save this design
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12">
                <Link href={`/auth?redirect=${encodeURIComponent(redirectTarget)}`}>
                  I already have an account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
