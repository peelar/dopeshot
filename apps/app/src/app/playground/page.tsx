import { notFound } from "next/navigation";
import { PlaygroundPage } from "@/app/playground/_components/playground-page";

const isPlaygroundEnabled =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_PLAYGROUND === "true";

export default function Playground() {
  if (!isPlaygroundEnabled) {
    notFound();
  }

  return <PlaygroundPage />;
}
