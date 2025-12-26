import { redirect } from "next/navigation";
import { GradientCurationWall } from "./_components/gradient-curation-wall";

export const metadata = {
  title: "Gradient Curation Wall | dopeshot",
  description: "Internal curation environment for gradient templates",
};

export default function GradientsPage() {
  // Dev-only guard
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return <GradientCurationWall />;
}
