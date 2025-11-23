import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/infra/supabase/server";
import { createDefaultLayoutConfig } from "@/domain/layout/engine";
import { Composition } from "@/domain/composition/types";
import { EditorClient } from "./editor-client";

interface ProjectEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectEditorPage({ params }: ProjectEditorPageProps) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if project exists and user has access
  const { data: projectData } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!projectData) {
    redirect("/dashboard");
  }

  // Fetch composition
  const { data: rawComposition } = await supabase
    .from("compositions")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let composition: Composition;
  if (rawComposition) {
    // Map snake_case DB to camelCase Domain
    composition = {
      id: rawComposition.id,
      projectId: rawComposition.project_id,
      userId: rawComposition.user_id,
      name: rawComposition.name,
      layoutConfig: rawComposition.layout_config,
      createdAt: rawComposition.created_at,
      updatedAt: rawComposition.updated_at,
    };
  } else {
    // Create default composition - this will be saved by the client on first edit
    const defaultLayout = createDefaultLayoutConfig();
    composition = {
      id: "temp", // Temporary ID, will be replaced when saved
      projectId: id,
      userId: user.id,
      name: "Default Composition",
      layoutConfig: defaultLayout,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return (
    <EditorClient
      initialConfig={composition.layoutConfig}
      compositionId={composition.id}
      projectId={id}
      projectName={projectData.name || "Untitled Project"}
    />
  );
}
