import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-12 px-6 py-16">
      <div className="space-y-6">
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
          Cover Forge
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          Build AI-assisted cover art with a focused editor and Supabase auth.
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          A lean starting point wired with Next.js 15, Tailwind, shadcn/ui, Vercel AI SDK,
          and Supabase for auth, storage, and data.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button size="lg">
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/project/demo-1/editor">
            <Button variant="outline" size="lg">
              View sample editor
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Realtime auth</p>
          <p className="text-sm text-slate-600">
            Supabase email magic links with session persistence handled via server components.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Design workflow</p>
          <p className="text-sm text-slate-600">
            Dashboard lists your projects and jumps into an editor built for AI-guided covers.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">AI hook</p>
          <p className="text-sm text-slate-600">
            Vercel AI SDK chat endpoint is wired for tool calls with a safe fallback message.
          </p>
        </div>
      </div>
    </main>
  );
}
