"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";

const layoutSections = [
  {
    headline: "Peak Left layout",
    subheadline:
      "A bold composition that lets the product peek in from the left while the copy stays clean and focused.",
    imageSrc: "/demo1.png",
    imageAlt: "Placeholder screenshot for the Peak Left layout",
    variant: "peak-left",
  },
  {
    headline: "Peak Right layout",
    subheadline:
      "Balance your story with a right-sided visual reveal that keeps text anchored and scannable.",
    imageSrc: "/demo2.png",
    imageAlt: "Placeholder screenshot for the Peak Right layout",
    variant: "peak-right",
  },
  {
    headline: "Peak Center layout",
    subheadline:
      "Let the image rise from the bottom while your message floats above for a dramatic reveal.",
    imageSrc: "/cover.png",
    imageAlt: "Placeholder screenshot for the Peak Center layout",
    variant: "peak-center",
  },
] as const;

type LayoutVariant = (typeof layoutSections)[number]["variant"];

interface LayoutShowcaseSectionProps {
  headline: string;
  subheadline: string;
  imageSrc: string;
  imageAlt: string;
  variant: LayoutVariant;
  sectionRef: (element: HTMLDivElement | null) => void;
}

const imageMotionStyle = {
  transform:
    "translate3d(calc(var(--image-x) * (1 - var(--reveal-progress))), calc(var(--image-y) * (1 - var(--reveal-progress))), 0) scale(calc(0.96 + var(--reveal-progress) * 0.04))",
  opacity: "calc(0.4 + var(--reveal-progress) * 0.6)",
} as const;

const textMotionStyle = {
  transform:
    "translate3d(calc(var(--text-x) * (1 - var(--reveal-progress))), calc(var(--text-y) * (1 - var(--reveal-progress))), 0)",
  opacity: "calc(0.3 + var(--reveal-progress) * 0.7)",
} as const;

function LayoutShowcaseSection({
  headline,
  subheadline,
  imageSrc,
  imageAlt,
  variant,
  sectionRef,
}: LayoutShowcaseSectionProps) {
  const isCenter = variant === "peak-center";
  const isRight = variant === "peak-right";

  return (
    <div
      ref={sectionRef}
      data-variant={variant}
      className={`relative overflow-hidden py-16 sm:py-20 [--reveal-progress:0] ${
        isCenter
          ? "[--image-x:0px] [--text-x:0px]"
          : isRight
            ? "[--image-x:110px] [--text-x:-40px] md:[--image-x:200px] md:[--text-x:-80px]"
            : "[--image-x:-110px] [--text-x:40px] md:[--image-x:-200px] md:[--text-x:80px]"
      } ${
        isCenter
          ? "[--image-y:120px] [--text-y:30px] md:[--image-y:160px] md:[--text-y:40px]"
          : "[--image-y:40px] [--text-y:20px] md:[--image-y:60px] md:[--text-y:30px]"
      }`}
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {isCenter ? (
          <div className="relative flex flex-col items-center gap-10 text-center">
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl ring-1 ring-white/5"
              style={imageMotionStyle}
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 700px, (min-width: 768px) 640px, 100vw"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>
            <div
              className="max-w-2xl space-y-4 text-center"
              style={textMotionStyle}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-orange)]/80">
                Peak Center
              </p>
              <h3 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {headline}
              </h3>
              <p className="text-base text-muted-foreground sm:text-lg">
                {subheadline}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div
              className={`${isRight ? "order-2 md:order-1" : "order-1"}`}
              style={imageMotionStyle}
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl ring-1 ring-white/5">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 520px, (min-width: 768px) 420px, 100vw"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-transparent" />
              </div>
            </div>
            <div
              className={`flex flex-col gap-4 ${isRight ? "order-1 md:order-2 md:text-left" : "order-2 md:order-1 md:text-left"}`}
              style={textMotionStyle}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-orange)]/80">
                {isRight ? "Peak Right" : "Peak Left"}
              </p>
              <h3 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {headline}
              </h3>
              <p className="text-base text-muted-foreground sm:text-lg">
                {subheadline}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LandingLayoutShowcase() {
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sections = useMemo(() => layoutSections, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const setProgress = (value: number) => {
      sectionRefs.current.forEach((section) => {
        if (!section) return;
        section.style.setProperty("--reveal-progress", value.toString());
      });
    };

    if (prefersReducedMotion.matches) {
      setProgress(1);
      return undefined;
    }

    let rafId = 0;

    const updateProgress = () => {
      rafId = 0;
      sectionRefs.current.forEach((section) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const rawProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height * 0.35);
        const clampedProgress = Math.min(1, Math.max(0, rawProgress));
        section.style.setProperty("--reveal-progress", clampedProgress.toString());
      });
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateProgress);
    };

    requestUpdate();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <section id="examples" className="relative overflow-hidden py-16 sm:py-20">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, oklch(0.65 0.22 41.12 / 0.12), transparent 55%)",
          }}
        />
      </div>

      <div className="container mx-auto mb-10 max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-[var(--accent-orange)]/80">
          Layout Showcase
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Reveal-ready compositions
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Three scroll-reveal patterns built for landing pages, launches, and product stories.
        </p>
      </div>

      <div className="space-y-10">
        {sections.map((section, index) => (
          <LayoutShowcaseSection
            key={section.variant}
            {...section}
            sectionRef={(element) => {
              sectionRefs.current[index] = element;
            }}
          />
        ))}
      </div>
    </section>
  );
}
