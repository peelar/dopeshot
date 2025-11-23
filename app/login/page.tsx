import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/infra/supabase/server";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase text-slate-500">Cover Forge</p>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        </div>
        <Link href="/" className="text-sm text-slate-600 underline">
          Back home
        </Link>
      </div>
      <Card>
        <CardHeader>
          <p className="text-sm text-slate-600">
            Use email magic links via Supabase. Sessions persist across reloads.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
