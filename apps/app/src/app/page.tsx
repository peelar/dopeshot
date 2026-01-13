import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { verifySession } from "@/lib/auth/session";

export default async function Page() {
  const session = await verifySession();

  return (
    <PlaygroundPage
      initialIsAuthenticated={session.isAuth}
    />
  );
}
