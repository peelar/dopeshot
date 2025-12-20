"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_CONFIGS } from "@/lib/demo-configs";
import Image from "next/image";
import { track } from "@/lib/analytics";

export function DemoPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return; // Pause cycling when hovered

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % DEMO_CONFIGS.length;
        track("demo_viewed", { demo_index: nextIndex });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const currentDemo = DEMO_CONFIGS[currentIndex];

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDemo.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full h-full"
        >
          {/* Demo output container */}
          <div
            className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border"
            style={{ background: currentDemo.gradient }}
          >
            {/* Placeholder for demo image */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              {currentDemo.image ? (
                <div className="relative w-full h-full">
                  <Image
                    src={currentDemo.image}
                    alt={currentDemo.useCase}
                    fill
                    className="object-contain"
                    priority={currentIndex === 0}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <div className="w-48 h-48 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-sm">
                      {currentDemo.useCase}
                    </span>
                  </div>
                  {currentDemo.title && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {currentDemo.title}
                      </p>
                      {currentDemo.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {currentDemo.subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Layout indicator badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2"
          >
            <div className="px-4 py-2 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground whitespace-nowrap">
              {currentDemo.useCase}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Cycle indicator dots */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
        {DEMO_CONFIGS.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              track("demo_interacted", { action: "dot_clicked", index });
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-[var(--accent-orange)] w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`View ${DEMO_CONFIGS[index].useCase} demo`}
          />
        ))}
      </div>
    </div>
  );
}
