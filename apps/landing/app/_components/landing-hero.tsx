"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";

export function LandingHero() {
  const scrollToExamples = () => {
    track("landing_secondary_cta_clicked", { action: "scroll_to_examples" });
    document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden">
      {/* Minimal background */}
      <div className="absolute inset-0 -z-10">
        {/* Very subtle orange tint */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 30%, oklch(0.65 0.22 41.12 / 0.03), transparent 60%)`
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "4rem 4rem",
          }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Free, no login required</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your product is dope,
            <br />
            <span style={{ color: "oklch(0.65 0.22 41.12 / 1)" }}>
              your screenshots should be too
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mb-12 text-lg text-muted-foreground sm:text-xl">
            Not a design tool — a finishing tool. Drop a screenshot, pick a look, export.
            <br className="hidden sm:block" />
            Ship better-looking assets in seconds, not hours.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="https://app.dopeshot.io"
              onClick={() => track("landing_primary_cta_clicked", { location: "hero" })}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[oklch(0.65_0.22_41.12_/_1)] px-8 text-base font-medium text-white transition-all hover:scale-105 hover:bg-[oklch(0.60_0.22_41.12_/_1)] active:scale-95 sm:w-auto"
            >
              Try it free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={scrollToExamples}
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-background px-8 text-base font-medium transition-all hover:bg-accent hover:scale-105 active:scale-95 sm:w-auto"
            >
              See examples
            </button>
          </div>

          {/* Social proof placeholder */}
          <p className="mt-12 text-sm text-muted-foreground">
            Built for indie hackers, makers, and builders who ship fast
          </p>
        </div>
      </div>
    </section>
  );
}
