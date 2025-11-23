"use server";

import { createProjectStub } from "@/lib/projects";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const createProjectAction = async () => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const project = createProjectStub(user.id);
  redirect(`/project/${project.id}/editor`);
};

export const signOut = async () => {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
};
