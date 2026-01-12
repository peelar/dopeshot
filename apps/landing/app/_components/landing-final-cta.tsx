"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";

export function LandingFinalCta() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-neutral-950 py-16 sm:py-20 lg:py-24"
    >
      {/* Subtle dark gradient + texture */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(10,10,10,1) 55%, rgba(0,0,0,1) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px circle at 50% 35%, oklch(0.65 0.22 41.12 / 0.16), transparent 55%), radial-gradient(700px circle at 15% 85%, oklch(0.705 0.213 47.604 / 0.10), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(circle at 50% 30%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0) 78%)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 30%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0) 78%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Turn screenshots into{" "}
              <span className="text-[var(--accent-orange)]">share-ready</span> graphics.
              <br />
              In seconds.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300/80">
              No Figma. No Photoshop. Just drop a screenshot, pick a vibe, and export a post that looks like you hired a
              designer.
            </p>

            <div className="mt-10 flex flex-col items-center gap-6">
              <Link
                href="https://app.dopeshot.io"
                onClick={() => track("landing_primary_cta_clicked", { location: "final_cta" })}
                className="group relative inline-flex h-16 items-center justify-center gap-2 rounded-xl bg-[var(--accent-orange)] px-10 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Try it free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-orange-light)] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>

              <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300/80">
                <span className="font-semibold text-white">Under 15s</span>
                <span className="opacity-50">•</span>
                <span>High-res PNG</span>
                <span className="opacity-50">•</span>
                <span>No watermark</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
