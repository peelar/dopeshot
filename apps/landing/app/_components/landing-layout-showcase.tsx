"use client";

import Image from "next/image";
import { BookmarkCheck, Download, LayoutGrid, Monitor, Palette, Smartphone, Type, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";

type BentoCardSize = "hero" | "wide" | "small";

type BentoCard = {
  key: string;
  size: BentoCardSize;
  headline: string;
  subheadline: string;
  icon: typeof Zap;
  render?: () => ReactNode;
};

const bentoCards: BentoCard[] = [
  {
    key: "core",
    size: "hero",
    headline: "Post faster",
    subheadline: "Turn screenshots into share-ready graphics in seconds—no Figma detour.",
    icon: Zap,
    render: () => (
      <div className="mt-6 flex h-full flex-col justify-end gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300/75">
          <span className="rounded-full border border-neutral-800 bg-neutral-950/50 px-3 py-1">
            Drop a screenshot
          </span>
          <span className="text-neutral-500">→</span>
          <span className="rounded-full border border-neutral-800 bg-neutral-950/50 px-3 py-1">
            Pick a look
          </span>
          <span className="text-neutral-500">→</span>
          <span className="rounded-full border border-neutral-800 bg-neutral-950/50 px-3 py-1">
            Export
          </span>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/40">
          <div
            className="pointer-events-none absolute -inset-24 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(249,115,22,0.22), transparent 55%), radial-gradient(circle at 90% 10%, rgba(249,115,22,0.10), transparent 40%)",
            }}
          />
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/cover.png"
              alt="dopeshot editor preview"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 700px, 100vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/25 to-transparent" />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "gradients",
    size: "wide",
    headline: "Smart gradients",
    subheadline: "Instant polish that matches your screenshot—so every post looks intentional.",
    icon: Palette,
    render: () => (
      <div className="mt-6 grid gap-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-orange-500/20 ring-1 ring-orange-500/20" />
          <div className="h-10 w-10 rounded-full bg-orange-500/10 ring-1 ring-orange-500/15" />
          <div className="h-10 w-10 rounded-full bg-neutral-950/40 ring-1 ring-neutral-800" />
          <div className="ml-auto hidden text-xs text-neutral-400 sm:block">Auto-matched palette</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
          <div className="h-16 w-full rounded-lg bg-gradient-to-br from-orange-500/25 via-orange-500/10 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-950/30 via-transparent to-neutral-950/40" />
        </div>
      </div>
    ),
  },
  {
    key: "typography",
    size: "wide",
    headline: "Typography vibes",
    subheadline: "Pick a mood, not a font—stay readable without fiddling with sizes.",
    icon: Type,
    render: () => (
      <div className="mt-6 grid gap-4">
        <div className="flex flex-wrap gap-2">
          {["Founder", "Billboard", "Terminal"].map((label) => (
            <span
              key={label}
              className="rounded-full border border-neutral-800 bg-neutral-950/50 px-3 py-1 text-xs text-neutral-200"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/35 p-4">
          <div className="text-lg font-semibold tracking-tight text-white">Your launch, louder</div>
          <div className="mt-1 text-xs text-neutral-400">Type adapts to keep your message clean</div>
        </div>
      </div>
    ),
  },
  {
    key: "looks",
    size: "small",
    headline: "Three looks",
    subheadline: "Peak, Spotlight, Backdrop—switch the story without redesigning.",
    icon: LayoutGrid,
    render: () => (
      <div className="mt-5 grid gap-2">
        <div className="grid grid-cols-3 gap-2">
          {["Peak", "Spotlight", "Backdrop"].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-neutral-800 bg-neutral-950/35 px-2 py-2 text-center text-xs text-neutral-200"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="text-xs text-neutral-400">
          Built for landing pages, launches, and product stories
        </div>
      </div>
    ),
  },
  {
    key: "modes",
    size: "small",
    headline: "Device modes",
    subheadline: "Ship a desktop post or a mobile story—without resizing headaches.",
    icon: Smartphone,
    render: () => (
      <div className="mt-5 flex items-end gap-3">
        <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950/35 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-neutral-300/80">
            <Monitor className="h-4 w-4 text-orange-500/70" />
            Desktop
          </div>
          <div className="aspect-[16/9] w-full rounded-lg border border-neutral-800 bg-neutral-900/40" />
        </div>
        <div className="w-[42%] rounded-xl border border-neutral-800 bg-neutral-950/35 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-neutral-300/80">
            <Smartphone className="h-4 w-4 text-orange-500/70" />
            Mobile
          </div>
          <div className="aspect-[9/16] w-full rounded-lg border border-neutral-800 bg-neutral-900/40" />
        </div>
      </div>
    ),
  },
  {
    key: "export",
    size: "small",
    headline: "Export ready",
    subheadline: "High‑res PNG sized for Twitter and LinkedIn—hit post with confidence.",
    icon: Download,
    render: () => (
      <div className="mt-5 grid gap-2">
        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/35 px-3 py-2">
          <span className="text-xs text-neutral-200">Desktop</span>
          <span className="rounded-full border border-neutral-800 bg-neutral-900/60 px-2 py-0.5 text-[11px] text-neutral-200">
            1920×1080
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/35 px-3 py-2">
          <span className="text-xs text-neutral-200">Mobile</span>
          <span className="rounded-full border border-neutral-800 bg-neutral-900/60 px-2 py-0.5 text-[11px] text-neutral-200">
            1080×1920
          </span>
        </div>
        <div className="text-xs text-neutral-400">No watermark</div>
      </div>
    ),
  },
  {
    key: "saved",
    size: "small",
    headline: "Saved designs",
    subheadline: "Keep your best shots on deck—come back later without starting over.",
    icon: BookmarkCheck,
    render: () => (
      <div className="mt-5 grid gap-2">
        {[
          { label: "Peak • Founder", meta: "Just now" },
          { label: "Backdrop • Billboard", meta: "Today" },
          { label: "Spotlight • Terminal", meta: "This week" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/35 px-3 py-2"
          >
            <span className="text-xs text-neutral-200">{row.label}</span>
            <span className="text-[11px] text-neutral-500">{row.meta}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const sizeClasses: Record<BentoCardSize, string> = {
  hero: "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2",
  wide: "sm:col-span-2 lg:col-span-2",
  small: "lg:col-span-1",
};

export function LandingLayoutShowcase() {
  const cardWrappersRef = useRef<Array<HTMLDivElement | null>>([]);
  const cards = useMemo(() => bentoCards, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const wrappers = cardWrappersRef.current.filter(Boolean) as HTMLDivElement[];
    if (wrappers.length === 0) return undefined;

    if (prefersReducedMotion) {
      wrappers.forEach((el) => el.classList.add("visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLDivElement).classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    wrappers.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="examples" className="relative overflow-hidden bg-neutral-950 py-20 sm:py-28">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 18% 18%, rgba(249,115,22,0.10), transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 85% 75%, rgba(249,115,22,0.08), transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="container mx-auto mb-14 max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-orange-500/80">
          In the editor
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Reveal-ready compositions
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-neutral-300/75 sm:text-lg lg:text-xl">
          The finishing touches that turn a raw screenshot into something you actually want to post.
        </p>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 sm:auto-rows-[13.5rem] lg:grid-cols-4 lg:auto-rows-[14rem]">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={card.key}
                ref={(el) => {
                  cardWrappersRef.current[index] = el;
                }}
                className={`fade-in-on-scroll h-full ${sizeClasses[card.size]}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <article className="group relative h-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <h3
                          className={
                            card.size === "hero"
                              ? "text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                              : "text-xl font-semibold tracking-tight text-white"
                          }
                        >
                          {card.headline}
                        </h3>
                        <p
                          className={
                            card.size === "hero"
                              ? "mt-3 max-w-[44ch] text-sm leading-relaxed text-neutral-300/80 sm:text-base"
                              : "mt-2 text-sm leading-relaxed text-neutral-300/75"
                          }
                        >
                          {card.subheadline}
                        </p>
                      </div>

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                        <Icon className="h-5 w-5 text-orange-500/80" />
                      </div>
                    </div>

                    {card.render ? card.render() : null}
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
