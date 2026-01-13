import { redirect } from "next/navigation";
import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { verifySession } from "@/lib/auth/session";
import { getUserDb } from "@/lib/data/dal";

type PageProps = {
  params: Promise<{
    itemId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const session = await verifySession();
  const { itemId } = await params;

  if (!session.isAuth || !session.userId) {
    redirect("/");
  }

  const db = await getUserDb(session.userId);
  const item = await db.memoryItem.findFirst({
    where: {
      id: itemId,
      userId: session.userId,
    },
    select: { id: true },
  });

  if (!item) {
    redirect("/");
  }

  return (
    <PlaygroundPage
      initialIsAuthenticated={session.isAuth}
      initialMemoryItemId={itemId}
    />
  );
}
