"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function BeforeAfter() {
  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Before */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Before
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-border bg-muted">
            <Image
              src="/demos/demo-product.svg"
              alt="Plain screenshot"
              fill
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Plain screenshot</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 z-10">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-orange)] flex items-center justify-center shadow-lg shadow-[var(--accent-orange)]/30">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* After */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-[var(--accent-orange)] uppercase tracking-wider">
            After (dopeshot)
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-[var(--accent-orange)]/30 bg-gradient-to-br from-[var(--accent-orange)]/10 to-transparent shadow-2xl shadow-[var(--accent-orange)]/20">
            <Image
              src="/demos/demo-product.svg"
              alt="Dopeshot output"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Same screenshot. <span className="text-[var(--accent-orange)] font-semibold">10 seconds later.</span>
        </p>
      </div>
    </div>
  );
}
