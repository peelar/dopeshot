"use client";

import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { cn } from "@/utils";

export function MobileOverlay() {
  const isMobile = useMobileDetection();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-4 max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Mobile Coming Soon</h2>
        <p className="text-muted-foreground">
          dopeshot works best on desktop for now. We&apos;re working on bringing the full experience
          to mobile soon.
        </p>
        <p className="text-sm text-muted-foreground/80">
          Please visit us on a desktop or tablet for the best experience.
        </p>
      </div>
    </div>
  );
}
