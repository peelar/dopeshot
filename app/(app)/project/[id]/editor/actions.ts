"use server";

import { createServerSupabaseClientForActions } from "@/infra/supabase/server";
import { LayoutConfig } from "@/domain/layout/types";
import { Composition } from "@/domain/composition/types";
import { createDefaultLayoutConfig } from "@/domain/layout/engine";

export async function ensureProject(projectId: string) {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Check if project exists
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) {
    if (projectId === "demo-1" || projectId === "demo-2") {
      throw new Error(
        "Demo projects are not persistent. Please create a new project from the dashboard.",
      );
    }

    throw new Error("Project not found");
  }

  return project;
}

export async function getComposition(projectId: string): Promise<Composition> {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Fetch composition
  const { data: rawComposition } = await supabase
    .from("compositions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rawComposition) {
    // Map snake_case DB to camelCase Domain
    return {
      id: rawComposition.id,
      projectId: rawComposition.project_id,
      userId: rawComposition.user_id,
      name: rawComposition.name,
      layoutConfig: rawComposition.layout_config,
      createdAt: rawComposition.created_at,
      updatedAt: rawComposition.updated_at,
    };
  }

  // If no composition exists, create a default one
  const defaultLayout = createDefaultLayoutConfig();

  const { data: newRawComposition, error } = await supabase
    .from("compositions")
    .insert({
      project_id: projectId,
      user_id: user.id,
      name: "Default Composition",
      layout_config: defaultLayout,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating default composition:", error);
    throw new Error("Failed to create composition");
  }

  return {
    id: newRawComposition.id,
    projectId: newRawComposition.project_id,
    userId: newRawComposition.user_id,
    name: newRawComposition.name,
    layoutConfig: newRawComposition.layout_config,
    createdAt: newRawComposition.created_at,
    updatedAt: newRawComposition.updated_at,
  };
}

export async function updateComposition(
  compositionId: string,
  layoutConfig: LayoutConfig,
  projectId: string,
) {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // If compositionId is "temp", create a new composition
  if (compositionId === "temp") {
    const { data: newComposition, error } = await supabase
      .from("compositions")
      .insert({
        project_id: projectId,
        user_id: user.id,
        name: "Default Composition",
        layout_config: layoutConfig,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating composition:", error);
      throw new Error("Failed to create composition");
    }

    return newComposition.id;
  }

  // Otherwise, update existing composition
  const { error } = await supabase
    .from("compositions")
    .update({
      layout_config: layoutConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", compositionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating composition:", error);
    throw new Error("Failed to update composition");
  }
}
