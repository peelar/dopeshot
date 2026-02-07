import { notFound } from "next/navigation";

import { showPersonalityPlaygroundFlag } from "@/lib/feature-flags";
import { PersonalityPlayground } from "./personality-playground";

export const metadata = {
  title: "Personality Playground",
};

export default async function PersonalityPlaygroundPage() {
  const enabled = await showPersonalityPlaygroundFlag();
  if (!enabled) {
    notFound();
  }

  return <PersonalityPlayground />;
}
