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

// Easing function for smooth cubic-bezier style animation
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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
  const isLeft = variant === "peak-left";

  // Peak sections need overflow visible to show edge-peaking
  const sectionClasses = `relative ${isCenter ? "overflow-hidden" : "overflow-visible"}`;

  return (
    <div
      ref={sectionRef}
      data-variant={variant}
      className={`${sectionClasses} py-24 sm:py-32 [--reveal-progress:0] [--eased-progress:0]`}
    >
      {/* Full-width container for edge-peaking effect */}
      <div className={`${isCenter ? "container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" : "w-full px-4 sm:px-6 lg:px-8"}`}>
        {isCenter ? (
          /* Peak Center Layout - Dramatic fade-in from bottom */
          <div className="relative flex flex-col items-center gap-12 text-center">
            {/* Screenshot with enhanced fade-in and scale */}
            <div
              className="relative w-full max-w-5xl"
              style={{
                transform: `translate3d(0, calc(180px * (1 - var(--eased-progress))), 0) scale(calc(0.85 + var(--eased-progress) * 0.15))`,
                opacity: `calc(var(--eased-progress) * var(--eased-progress))`, // Quadratic fade for more dramatic effect
              }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl ring-1 ring-white/5">
                {/* Glow effect behind */}
                <div 
                  className="absolute -inset-4 -z-10 rounded-3xl blur-2xl"
                  style={{
                    background: "radial-gradient(circle, oklch(0.65 0.22 41.12 / 0.25), transparent 70%)",
                    opacity: `var(--eased-progress)`,
                  }}
                />
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 900px, (min-width: 768px) 700px, 100vw"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
            </div>
            
            {/* Text content with staggered delay */}
            <div
              className="max-w-2xl space-y-4 text-center"
              style={{
                transform: `translate3d(0, calc(60px * (1 - var(--eased-progress))), 0)`,
                opacity: `calc(0.1 + var(--eased-progress) * 0.9)`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-orange)]/80">
                Peak Center
              </p>
              <h3 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {headline}
              </h3>
              <p className="text-base text-muted-foreground sm:text-lg">
                {subheadline}
              </p>
            </div>
          </div>
        ) : (
          /* Peak Left / Peak Right Layouts with edge-peaking */
          <div className="mx-auto max-w-7xl">
            <div className={`grid items-center gap-8 md:gap-12 lg:gap-16 md:grid-cols-2`}>
              {/* Image column - edge-peaking effect */}
              <div
                className={`
                  ${isRight ? "order-2" : "order-1"}
                  ${isRight ? "md:-mr-24 lg:-mr-40" : "md:-ml-24 lg:-ml-40"}
                `}
                style={{
                  transform: `translate3d(
                    calc(${isRight ? "160px" : "-160px"} * (1 - var(--eased-progress))), 
                    calc(50px * (1 - var(--eased-progress))), 
                    0
                  ) 
                  perspective(1000px) 
                  rotateY(calc(${isRight ? "-8deg" : "8deg"} * (1 - var(--eased-progress))))`,
                  opacity: `calc(0.2 + var(--eased-progress) * 0.8)`,
                }}
              >
                <div className="relative">
                  {/* Glow effect */}
                  <div 
                    className="absolute -inset-6 -z-10 rounded-3xl blur-3xl"
                    style={{
                      background: `radial-gradient(circle at ${isRight ? "70%" : "30%"} 50%, oklch(0.65 0.22 41.12 / 0.2), transparent 60%)`,
                      opacity: `var(--eased-progress)`,
                    }}
                  />
                  {/* Glassmorphism container */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/30 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
                    <div className="relative aspect-[4/3] w-full md:aspect-[3/2] lg:w-[140%]">
                      <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 700px, (min-width: 768px) 550px, 100vw"
                      />
                    </div>
                    {/* Enhanced gradient overlay */}
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-${isRight ? "l" : "r"} from-black/60 via-transparent to-transparent`} />
                  </div>
                </div>
              </div>

              {/* Text column */}
              <div
                className={`
                  flex flex-col gap-5
                  ${isRight ? "order-1 md:pr-8 lg:pr-12" : "order-2 md:pl-8 lg:pl-12"}
                  ${isRight ? "md:text-right" : "md:text-left"}
                `}
                style={{
                  transform: `translate3d(
                    calc(${isRight ? "-60px" : "60px"} * (1 - var(--eased-progress))), 
                    calc(30px * (1 - var(--eased-progress))), 
                    0
                  )`,
                  opacity: `calc(0.15 + var(--eased-progress) * 0.85)`,
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-orange)]/80">
                  {isRight ? "Peak Right" : "Peak Left"}
                </p>
                <h3 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {headline}
                </h3>
                <p className="text-base text-muted-foreground sm:text-lg lg:text-xl max-w-lg">
                  {subheadline}
                </p>
              </div>
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
        section.style.setProperty("--eased-progress", value.toString());
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
        const variant = section.dataset.variant;
        
        // Different reveal timing for center (needs earlier start for fade-in effect)
        const triggerMultiplier = variant === "peak-center" ? 0.6 : 0.4;
        const rawProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height * triggerMultiplier);
        const clampedProgress = Math.min(1, Math.max(0, rawProgress));
        
        // Apply easing for smooth animation
        const easedProgress = easeOutCubic(clampedProgress);
        
        section.style.setProperty("--reveal-progress", clampedProgress.toString());
        section.style.setProperty("--eased-progress", easedProgress.toString());
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
    <section id="examples" className="relative overflow-hidden py-20 sm:py-28">
      {/* Background accent */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, oklch(0.65 0.22 41.12 / 0.12), transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 80% 80%, oklch(0.65 0.22 41.12 / 0.08), transparent 50%)",
          }}
        />
      </div>

      {/* Section header */}
      <div className="container mx-auto mb-16 max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-[var(--accent-orange)]/80">
          Layout Showcase
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Reveal-ready compositions
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl">
          Three scroll-reveal patterns built for landing pages, launches, and product stories.
        </p>
      </div>

      {/* Layout sections with increased spacing */}
      <div className="space-y-16 sm:space-y-24">
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
