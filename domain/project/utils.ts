import { redirect } from "next/navigation";
import { Project } from "./types";

export const requireUser = (userId: string | null | undefined) => {
  if (!userId) {
    redirect("/login");
  }
};
