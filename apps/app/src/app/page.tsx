import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { SHOW_BRAND_EXPERIENCE_FLAG, isFeatureEnabled } from "@/lib/feature-flags";
import { verifySession } from "@/lib/auth/session";

export default async function Page() {
  const session = await verifySession();
  const showBrandExperience =
    session.isAuth &&
    (await isFeatureEnabled(session.userId, SHOW_BRAND_EXPERIENCE_FLAG));

  return <PlaygroundPage showBrandExperience={showBrandExperience} />;
}
