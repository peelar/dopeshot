"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden min-h-[80vh] flex items-center">
      {/* Background with subtle orange gradient */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 50%, oklch(0.65 0.22 41.12 / 0.05), transparent 50%)`
          }}
        />
        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-8 lg:pr-8">
            {/* Badge */}
            <Link
              href="/log"
              onClick={() => track("landing_update_badge_clicked")}
              className="group relative inline-flex items-center gap-3 rounded-full border border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/5 backdrop-blur-sm px-4 py-2 text-sm transition-all hover:border-[var(--accent-orange)]/60 hover:bg-[var(--accent-orange)]/10"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-orange)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-orange)]"></span>
              </span>
              <span className="font-medium text-[var(--accent-orange)]">New in dopeshot:</span>
              <span className="text-foreground">Preset backgrounds</span>
            </Link>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]">
              Your product is <span className="text-[var(--accent-orange)]">dope</span>, your screenshots should be too
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-foreground/80 sm:text-2xl max-w-xl leading-relaxed">
              Not a design tool—a finishing tool. Drop a screenshot, pick a look, ship in seconds.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="https://dopeshot.io"
                onClick={() => track("landing_primary_cta_clicked", { location: "hero" })}
                className="group relative inline-flex h-16 items-center justify-center gap-2 rounded-xl bg-[var(--accent-orange)] px-10 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Try it free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-orange-light)] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </div>
          </div>

          {/* Right side - Screenshot placeholder */}
          <div className="relative lg:pl-8 order-first lg:order-last">
            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-border bg-muted/50">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Screenshot placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
