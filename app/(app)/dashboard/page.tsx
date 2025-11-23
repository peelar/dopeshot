import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createProjectAction, signOut } from "./actions";
import { listProjectsForUser } from "@/lib/projects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projects = listProjectsForUser(user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase text-slate-500">Dashboard</p>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        </div>
        <form action={signOut}>
          <Button variant="ghost" type="submit" className="gap-2 text-slate-600">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-3">
        <p className="text-sm text-slate-600">Start a fresh cover concept.</p>
        <form action={createProjectAction}>
          <Button type="submit">New project</Button>
        </form>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500">Last updated</p>
                  <p className="text-sm text-slate-600">
                    {new Date(project.updatedAt).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {project.id}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
                <p className="text-sm text-slate-600">Owner: {project.userId}</p>
              </div>
              <Link href={`/project/${project.id}/editor`} className="text-sm">
                <Button variant="outline" className="gap-2">
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
