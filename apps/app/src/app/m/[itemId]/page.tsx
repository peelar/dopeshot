import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { verifySession } from "@/lib/auth/session";

type PageProps = {
  params: {
    itemId: string;
  };
};

export default async function Page({ params }: PageProps) {
  const session = await verifySession();

  return (
    <PlaygroundPage
      initialIsAuthenticated={session.isAuth}
      initialMemoryItemId={params.itemId}
    />
  );
}
