import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { showBrandExperienceFlag } from "@/lib/feature-flags";
import { verifySession } from "@/lib/auth/session";

type PageProps = {
  params: {
    itemId: string;
  };
};

export default async function Page({ params }: PageProps) {
  const [showBrandFlag, session] = await Promise.all([showBrandExperienceFlag(), verifySession()]);
  const showBrandExperience = showBrandFlag && session.isAuth;

  return (
    <PlaygroundPage
      showBrandExperience={showBrandExperience}
      initialMemoryItemId={params.itemId}
    />
  );
}
