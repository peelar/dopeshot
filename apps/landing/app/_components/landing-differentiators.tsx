"use client";

import { Zap, Palette, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const differentiators = [
  {
    icon: Zap,
    title: "No design skills needed",
    description: "Skip the design detour. Drop your screenshot and you're done.",
    gradient: "from-yellow-500/10 to-transparent",
  },
  {
    icon: Palette,
    title: "Polished in one click",
    description: "Smart defaults that actually work. Ship without tweaking.",
    gradient: "from-[var(--accent-orange)]/10 to-transparent",
  },
  {
    icon: RefreshCw,
    title: "Same quality every time",
    description: "Consistent output for all your product updates.",
    gradient: "from-blue-500/10 to-transparent",
  },
];

export function LandingDifferentiators() {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 70% 50%, oklch(0.65 0.22 41.12 / 0.03), transparent 50%)`
          }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 text-center fade-in-on-scroll">
          <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Why dopeshot?
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            A finishing tool, not a design tool. Built for makers who ship.
          </p>
        </div>

        {/* Differentiators grid */}
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
          {differentiators.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-[var(--accent-orange)]/30 hover:shadow-lg hover:shadow-[var(--accent-orange)]/5">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-4 relative inline-block">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border group-hover:border-[var(--accent-orange)]/50 transition-all duration-300">
                        <Icon className="h-5 w-5 text-[var(--accent-orange)]" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 text-base font-bold group-hover:text-[var(--accent-orange)] transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
