"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/ui/logo";

export default function AuthPage() {
  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-4 py-12 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Animated grid pattern */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-30 dark:opacity-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Central glow effect */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-100 dark:opacity-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.06) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 60%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.04) 0%, transparent 60%)
            `,
          }}
        />
      </div>

      {/* Subtle animated grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Header with logo */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-6">
        <a href="/" aria-label="Go to homepage" className="transition-opacity hover:opacity-80">
          <Logo />
        </a>
      </div>

      {/* Auth form */}
      <div className="relative z-10">
        <AuthForm />
      </div>

      {/* Footer tagline */}
      <div className="absolute bottom-6 left-0 right-0 z-10 text-center">
        <p className="text-sm text-zinc-500 dark:text-white/40">
          Built by builders, for builders
        </p>
      </div>
    </main>
  );
}
