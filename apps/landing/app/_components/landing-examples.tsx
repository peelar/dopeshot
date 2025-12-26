"use client";

import Image from "next/image";
import { track } from "@/lib/analytics";

const layouts = [
  {
    image: "/demos/demo-product.svg",
    caption: "Peak Layout",
    description: "Hero-style product shots",
  },
  {
    image: "/demos/demo-code.svg",
    caption: "Code Snippet",
    description: "Shareable code blocks",
  },
  {
    image: "/demos/demo-changelog.svg",
    caption: "Centered",
    description: "Clean & minimal",
  },
  {
    image: "/demos/demo-mobile.svg",
    caption: "Device Frame",
    description: "Mobile mockups",
  },
  {
    image: "/demos/demo-product.svg",
    caption: "Gradient Backdrop",
    description: "Bold backgrounds",
  },
  {
    image: "/demos/demo-changelog.svg",
    caption: "Browser Frame",
    description: "Web app previews",
  },
  {
    image: "/demos/demo-code.svg",
    caption: "Terminal",
    description: "CLI screenshots",
  },
  {
    image: "/demos/demo-mobile.svg",
    caption: "Side by Side",
    description: "Compare views",
  },
];

export function LandingExamples() {
  return (
    <section id="examples" className="relative scroll-mt-16 overflow-hidden py-16 sm:py-20">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 80% 20%, oklch(0.65 0.22 41.12 / 0.03), transparent 50%)`,
          }}
        />
      </div>

      {/* Section header */}
      <div className="container mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Gallery
          </h2>
          <p className="mx-auto max-w-xl text-gray-400">
            Assets created with dopeshot
          </p>
        </div>
      </div>

      {/* Layout rail */}
      <div className="relative" style={{ perspective: "1000px" }}>
        <div
          className="scrollbar-hide flex items-end gap-4 overflow-x-auto px-4 pb-12 pt-24 sm:px-8 lg:px-16"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {layouts.map((layout, index) => (
            <div
              key={index}
              onClick={() => track("layout_card_clicked", { index, caption: layout.caption })}
              className="group relative h-[240px] w-[280px] shrink-0 cursor-pointer transition-transform duration-[600ms] ease-out hover:z-20 hover:-translate-y-16 hover:scale-[1.25]"
            >
              {/* Card with pop-up effect */}
              <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900 transition-[border-color] duration-500 group-hover:border-orange-500/60">
                {/* Image */}
                <div className="absolute inset-0">
                  <Image
                    src={layout.image}
                    alt={layout.caption}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="180px"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <h3 className="mb-1 text-sm font-bold text-white drop-shadow-lg transition-transform duration-500 group-hover:-translate-y-1">
                    {layout.caption}
                  </h3>
                  <p className="max-h-0 overflow-hidden text-xs text-white/80 transition-all duration-500 group-hover:max-h-10">
                    {layout.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent sm:w-16" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l to-transparent sm:w-16" />
      </div>
    </section>
  );
}
