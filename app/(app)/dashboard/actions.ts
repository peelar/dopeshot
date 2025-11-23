"use server";

import { createServerSupabaseClientForActions } from "@/infra/supabase/server";
import { redirect } from "next/navigation";

export const createProjectAction = async () => {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: "Untitled Project",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/project/${project.id}/editor`);
};

export const signOut = async () => {
  const supabase = await createServerSupabaseClientForActions();
  await supabase.auth.signOut();
  redirect("/");
};
