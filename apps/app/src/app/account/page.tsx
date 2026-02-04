import { redirect } from "next/navigation";
import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { verifySession } from "@/lib/auth/session";

export default async function AccountPage() {
  const session = await verifySession();
  if (!session.isAuth) {
    redirect("/auth");
  }

  return (
    <PlaygroundPage
      initialIsAuthenticated={session.isAuth}
      initialOnboardingOpen={false}
      initialLeftSidebarView="account"
    />
  );
}
