"use client";

import { WaitlistForm } from "./waitlist-form";
import { Palette, Sparkles, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

export function LandingBrandingTeaser() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track("waitlist_form_viewed");
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="waitlist"
      ref={sectionRef}
      className="relative overflow-hidden py-16 sm:py-20"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, oklch(0.65 0.22 41.12 / 0.1), transparent 70%)`
          }}
        />
      </div>

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-border bg-gradient-to-br from-card to-background p-6 sm:p-10 lg:p-12 overflow-hidden">
          {/* Decorative gradient overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at 0% 0%, oklch(0.65 0.22 41.12 / 0.15), transparent 50%)`
            }}
          />

          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-6">
              {/* Coming soon badge */}
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/10 px-4 py-1.5 text-sm font-medium text-[var(--accent-orange)]">
                <Sparkles className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>

              {/* Headline */}
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Brand Kits
              </h2>

              {/* Description */}
              <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Upload your logo and colors once. Every screenshot automatically gets your brand treatment.
                {" "}
                <span className="text-foreground font-medium">
                  No manual work, no inconsistencies—just your vibe, every time.
                </span>
              </p>
            </div>

            {/* Features grid */}
            <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center gap-3 p-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-orange)]/10 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-[var(--accent-orange)]" />
                </div>
                <h3 className="font-semibold">Auto-branding</h3>
                <p className="text-sm text-muted-foreground">
                  Your colors, your fonts, applied instantly
                </p>
              </div>

              <div className="flex flex-col items-center text-center gap-3 p-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-orange)]/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[var(--accent-orange)]" />
                </div>
                <h3 className="font-semibold">Zero friction</h3>
                <p className="text-sm text-muted-foreground">
                  Upload once, use forever
                </p>
              </div>

              <div className="flex flex-col items-center text-center gap-3 p-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-orange)]/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[var(--accent-orange)]" />
                </div>
                <h3 className="font-semibold">Stay consistent</h3>
                <p className="text-sm text-muted-foreground">
                  Same look, every post
                </p>
              </div>
            </div>

            {/* Waitlist form */}
            <div className="pt-8">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
