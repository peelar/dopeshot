import { redirect } from "next/navigation";

import { DesignChat } from "@/components/design-chat";
import { UploadPlaceholder } from "@/components/upload-placeholder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProjectById } from "@/lib/projects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface ProjectEditorPageProps {
  params: { id: string };
}

export default async function ProjectEditorPage({ params }: ProjectEditorPageProps) {
  const { id } = params;
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const project = getProjectById(id, user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase text-slate-500">Editor</p>
          <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
        </div>
        <Button variant="outline">Save snapshot</Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="flex min-h-[480px] items-center justify-center bg-slate-900 text-white">
          <p className="text-lg font-semibold">Cover preview will go here</p>
        </Card>
        <div className="space-y-4">
          <DesignChat />
          <UploadPlaceholder />
        </div>
      </section>
    </main>
  );
}
