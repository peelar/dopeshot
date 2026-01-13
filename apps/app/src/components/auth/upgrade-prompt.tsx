"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";

type UpgradePromptProps = {
  title?: string;
  description?: string;
  className?: string;
  onUpgradeClick?: () => void;
};

export function UpgradePrompt({
  title = "Upgrade required",
  description = "This feature is available on the Brand tier.",
  className,
  onUpgradeClick,
}: UpgradePromptProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-muted/10 p-4", className)}>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            track("upgrade_prompt_clicked");
            onUpgradeClick?.();
            if (!onUpgradeClick) {
              window.location.href = "mailto:feedback@dopeshot.io?subject=Upgrade%20to%20Brand";
            }
          }}
        >
          Upgrade to Brand
        </Button>
        <p className="text-xs text-muted-foreground">Need access? Contact us.</p>
      </div>
    </div>
  );
}

