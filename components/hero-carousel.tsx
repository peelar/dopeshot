"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
};

const RAW_SLIDES: Slide[] = [
  {
    id: "launch",
    title: "Launch update",
    subtitle: "New dashboard shipped with 2x faster load times.",
    badge: "Product release",
    gradientFrom: "#312e81",
    gradientTo: "#a855f7",
    accent: "#f5f3ff",
  },
  {
    id: "metrics",
    title: "Weekly numbers",
    subtitle: "Signups up 32% after our onboarding revamp.",
    badge: "Growth snapshot",
    gradientFrom: "#0f172a",
    gradientTo: "#22c55e",
    accent: "#dcfce7",
  },
  {
    id: "feature",
    title: "New integration",
    subtitle: "Connect Stripe in minutes with guided setup.",
    badge: "What's new",
    gradientFrom: "#0b1120",
    gradientTo: "#60a5fa",
    accent: "#dbeafe",
  },
  {
    id: "community",
    title: "Community highlight",
    subtitle: "See how teams are polishing their product shots.",
    badge: "Made with dopeshot",
    gradientFrom: "#1d0f33",
    gradientTo: "#f43f5e",
    accent: "#ffe4e6",
  },
];

export function HeroCarousel() {
  const slides = useMemo(() => RAW_SLIDES, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [isPaused, slides.length]);

  const handleManualChange = (index: number) => {
    setActiveIndex(index);
    setIsPaused(true);
  };

  return (
    <div
      className="w-full max-w-4xl"
      aria-roledescription="carousel"
      aria-label="Example outputs"
    >
      <div
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-4 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.65)] backdrop-blur"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <div className="relative aspect-[16/9] w-full">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className={cn(
                  "absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 transition-all duration-500 ease-out",
                  isActive ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                style={{
                  background: `linear-gradient(135deg, ${slide.gradientFrom}, ${slide.gradientTo})`,
                  transform: isActive ? "scale(1.05)" : "scale(0.98)",
                }}
              >
                <div className="relative flex flex-1 flex-col p-8 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_25%)]" />
                  <div className="relative flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
                      {slide.badge}
                    </span>
                    <span className="text-xs text-white/80">OG-ready • 1200×630</span>
                  </div>
                  <div className="relative mt-auto grid gap-6 sm:grid-cols-[1.05fr,0.95fr]">
                    <div className="space-y-3">
                      <h3 className="text-3xl font-semibold leading-tight sm:text-4xl">
                        {slide.title}
                      </h3>
                      <p className="max-w-xl text-base text-white/85 sm:text-lg">{slide.subtitle}</p>
                      <div
                        className="mt-4 rounded-xl border border-white/15 bg-white/10 p-4 text-sm text-white/90 shadow-inner"
                        style={{ color: slide.accent }}
                      >
                        <div className="flex items-center gap-2 text-white">
                          <span className="h-2 w-2 rounded-full bg-white/80" aria-hidden="true" />
                          <span>Layered gradients + drop shadow</span>
                        </div>
                        <div className="mt-2 h-2 w-24 rounded-full bg-white/30" aria-hidden="true" />
                        <div className="mt-1 h-2 w-32 rounded-full bg-white/20" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="relative rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
                      <div className="mb-3 flex items-center justify-between text-xs text-white/80">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
                          Preview
                        </span>
                        <span>Twitter • Dark</span>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3 shadow-inner">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-white/40" aria-hidden="true" />
                          <div className="space-y-2">
                            <div className="h-2.5 w-28 rounded-full bg-white/50" aria-hidden="true" />
                            <div className="h-2 w-16 rounded-full bg-white/30" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="mt-4 h-28 rounded-lg bg-white/10" aria-hidden="true" />
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 w-14 rounded-full bg-white/40" aria-hidden="true" />
                          <div className="h-2 w-10 rounded-full bg-white/30" aria-hidden="true" />
                          <div className="h-2 w-12 rounded-full bg-white/20" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show example ${index + 1}`}
            aria-pressed={index === activeIndex}
            className={cn(
              "h-2.5 w-2.5 rounded-full border border-border/70 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              index === activeIndex ? "w-8 bg-foreground/90" : "bg-muted",
            )}
            onClick={() => handleManualChange(index)}
          />
        ))}
      </div>
    </div>
  );
}
