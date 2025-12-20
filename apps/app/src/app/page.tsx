import { PlaygroundPage } from "@/app/(playground)/_components/playground-page";
import { showBrandExperienceFlag } from "@/lib/feature-flags";

export default async function Page() {
  const showBrandExperience = await showBrandExperienceFlag();

  return <PlaygroundPage showBrandExperience={showBrandExperience} />;
}
