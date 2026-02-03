import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { verifySession } from "@/lib/auth/session";

export default async function AccountPage() {
  const session = await verifySession();

  return (
    <PlaygroundPage
      initialIsAuthenticated={session.isAuth}
      initialOnboardingOpen={false}
      initialLeftSidebarView="account"
    />
  );
}
