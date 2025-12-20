"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";
import { BeforeAfter } from "./before-after";

export function LandingHero() {
  const scrollToWaitlist = () => {
    track("landing_secondary_cta_clicked", { action: "scroll_to_waitlist" });
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

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
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-orange)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-orange)]"></span>
              </span>
              <span>Free. No login. No watermark.</span>
            </div>

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
              <button
                onClick={scrollToWaitlist}
                className="inline-flex h-16 items-center justify-center rounded-xl px-8 text-base font-semibold text-muted-foreground transition-all hover:text-foreground hover:scale-105 active:scale-95"
              >
                Join the waitlist
              </button>
            </div>
          </div>

          {/* Right side - Before/After */}
          <div className="relative lg:pl-8 order-first lg:order-last">
            <BeforeAfter />
          </div>
        </div>
      </div>
    </section>
  );
}
