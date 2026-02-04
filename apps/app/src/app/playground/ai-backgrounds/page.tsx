import { notFound } from "next/navigation";

import { showAiBackgroundsFlag } from "@/lib/feature-flags";
import { AiBackgroundPlayground } from "./playground";

export const metadata = {
  title: "AI Background Playground",
};

export default async function AiBackgroundsPage() {
  const enabled = await showAiBackgroundsFlag();
  if (!enabled) {
    notFound();
  }

  return <AiBackgroundPlayground />;
}
