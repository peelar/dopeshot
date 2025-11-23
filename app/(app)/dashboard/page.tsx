import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/infra/supabase/server";
import { createDefaultLayoutConfig } from "@/domain/layout/engine";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Find most recently updated composition
  const { data: compositions } = await supabase
    .from("compositions")
    .select("id, project_id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (compositions && compositions.length > 0) {
    const composition = compositions[0];
    redirect(`/project/${composition.project_id}/editor?compositionId=${composition.id}`);
  }

  // No compositions exist, create new project + default composition
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: "Untitled Project",
    })
    .select()
    .single();

  if (projectError || !project) {
    throw new Error("Failed to create project");
  }

  const defaultLayout = createDefaultLayoutConfig();
  const { data: composition, error: compositionError } = await supabase
    .from("compositions")
    .insert({
      project_id: project.id,
      user_id: user.id,
      name: "Default Composition",
      layout_config: defaultLayout,
    })
    .select()
    .single();

  if (compositionError || !composition) {
    throw new Error("Failed to create composition");
  }

  redirect(`/project/${project.id}/editor?compositionId=${composition.id}`);
}
