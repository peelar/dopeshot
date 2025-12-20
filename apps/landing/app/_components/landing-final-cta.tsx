"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

export function LandingFinalCta() {
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, oklch(0.65 0.22 41.12 / 0.08), transparent 60%)`
          }}
        />
      </div>

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-6">
          Stop fussing with Figma.
          <br />
          <span className="text-[var(--accent-orange)]">Ship polished visuals in seconds.</span>
        </h2>

        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          The polish your product deserves, in 10 seconds.
        </p>

        <Link
          href="https://dopeshot.io"
          onClick={() => track("landing_primary_cta_clicked", { location: "final_cta" })}
          className="group relative inline-flex h-16 items-center justify-center gap-2 rounded-xl bg-[var(--accent-orange)] px-10 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)]"
        >
          <span className="relative z-10 flex items-center gap-2">
            Try it free
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-orange-light)] opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      </div>
    </section>
  );
}

