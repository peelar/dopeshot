"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

const HERO_VIDEO_SRC = "/videos/hero-demo.mp4"; // Replace with your video

function HeroVideoPlaceholder() {
  return (
    <div className="absolute inset-0 bg-neutral-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.18),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.06),transparent_50%)]" />
      <div className="relative h-full w-full bg-neutral-800/50 flex flex-col items-center justify-center gap-4">
        <div className="grid place-items-center size-16 rounded-full bg-black/30 ring-1 ring-white/10 shadow-2xl shadow-black/60">
          <Play className="size-7 text-white/85 translate-x-[1px]" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-white/85">Video coming soon</p>
          <p className="text-xs text-white/55">Drop in your MP4 at {HERO_VIDEO_SRC}</p>
        </div>
      </div>
    </div>
  );
}

function HeroVideoShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch(HERO_VIDEO_SRC, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        if (!isMounted) return;
        if (res.ok || res.status === 405) setShouldRenderVideo(true);
      })
      .catch(() => {
        // Keep placeholder
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative group">
      <div className="absolute -inset-10 -z-10 blur-3xl opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.25),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_45%)]" />

      <div
        className={[
          "relative transition-transform duration-700 ease-out",
          "lg:group-hover:translate-y-[-2px]",
          "lg:[transform:perspective(1200px)_rotateY(-10deg)_rotateX(3deg)]",
          "lg:group-hover:[transform:perspective(1200px)_rotateY(-7deg)_rotateX(2deg)]",
        ].join(" ")}
      >
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[var(--accent-orange)]/35 via-neutral-800/40 to-transparent shadow-2xl shadow-black/50">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 overflow-hidden backdrop-blur-sm">
            {/* Minimal browser chrome */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/80 bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-500/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="max-w-[18rem] w-full h-7 rounded-full bg-neutral-900/70 border border-neutral-800/70 px-3 flex items-center justify-center">
                  <span className="text-[11px] text-white/60 truncate">dopeshot.app</span>
                </div>
              </div>
              <div className="w-10" />
            </div>

            <div className="relative aspect-video bg-neutral-900">
              {shouldRenderVideo ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={HERO_VIDEO_SRC}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onError={() => setShouldRenderVideo(false)}
                />
              ) : (
                <HeroVideoPlaceholder />
              )}

              {!shouldReduceMotion && (
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),transparent_30%,transparent_70%,rgba(0,0,0,0.28))]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.09,
        delayChildren: shouldReduceMotion ? 0 : 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const videoVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18, scale: shouldReduceMotion ? 1 : 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="relative overflow-hidden min-h-[80vh] flex items-center"
    >
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
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-8 lg:pr-8">
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="group relative inline-flex items-center gap-3 rounded-full border border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/5 backdrop-blur-sm px-4 py-2 text-sm"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-orange)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-orange)]"></span>
              </span>
              <span className="font-medium text-[var(--accent-orange)]">New in dopeshot:</span>
              <span className="text-foreground">Preset backgrounds</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]"
            >
              Your product is <span className="text-[var(--accent-orange)]">dope</span>, your screenshots should be too
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={itemVariants} className="text-xl text-foreground/80 sm:text-2xl max-w-xl leading-relaxed">
              Not a design tool—a finishing tool. Drop a screenshot, pick a look, ship in seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="https://app.dopeshot.io"
                onClick={() => track("landing_primary_cta_clicked", { location: "hero" })}
                className="group relative inline-flex h-16 items-center justify-center gap-2 rounded-xl bg-[var(--accent-orange)] px-10 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Try it free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-orange-light)] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </motion.div>
          </div>

          {/* Right side - Video showcase */}
          <motion.div variants={videoVariants} className="relative lg:pl-8">
            <HeroVideoShowcase />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
