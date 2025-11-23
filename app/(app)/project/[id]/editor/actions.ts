"use server";

import { createServerSupabaseClientForActions } from "@/infra/supabase/server";
import { LayoutConfig } from "@/domain/layout/types";
import { Composition } from "@/domain/composition/types";
import { Asset } from "@/domain/asset/types";
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

  return compositionId;
}

export async function getCompositionById(compositionId: string): Promise<Composition> {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: rawComposition, error } = await supabase
    .from("compositions")
    .select("*")
    .eq("id", compositionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !rawComposition) {
    throw new Error("Composition not found");
  }

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

export async function getAllCompositions(): Promise<
  Array<Composition & { projectId: string; projectName: string }>
> {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: rawCompositions, error } = await supabase
    .from("compositions")
    .select("*, projects!inner(id, name)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch compositions");
  }

  return (
    rawCompositions?.map((raw: any) => ({
      id: raw.id,
      projectId: raw.project_id,
      userId: raw.user_id,
      name: raw.name,
      layoutConfig: raw.layout_config,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      projectName: raw.projects?.name || "Untitled Project",
    })) || []
  );
}

export async function createAssetRecord(
  projectId: string,
  url: string,
  name: string,
  kind: Asset["kind"],
): Promise<Asset> {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Create asset record
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      project_id: projectId,
      user_id: user.id,
      name,
      url,
      kind,
    })
    .select()
    .single();

  if (assetError || !asset) {
    throw new Error("Failed to create asset record");
  }

  return {
    id: asset.id,
    projectId: asset.project_id,
    userId: asset.user_id,
    name: asset.name,
    url: asset.url,
    kind: asset.kind as Asset["kind"],
    createdAt: asset.created_at,
  };
}

export async function createNewProjectWithComposition(): Promise<{
  projectId: string;
  compositionId: string;
}> {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Create project
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

  // Create default composition
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

  return {
    projectId: project.id,
    compositionId: composition.id,
  };
}

export async function getAllAssets(): Promise<Asset[]> {
  const supabase = await createServerSupabaseClientForActions();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: assets, error } = await supabase.from("assets").select("*").eq("user_id", user.id);

  if (error) {
    throw new Error("Failed to fetch assets");
  }

  return (
    assets?.map((a) => ({
      id: a.id,
      projectId: a.project_id,
      userId: a.user_id,
      name: a.name,
      url: a.url,
      kind: a.kind as Asset["kind"],
      createdAt: a.created_at,
    })) || []
  );
}
