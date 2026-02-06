"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";
import { Check } from "lucide-react";

const CONTACT_EMAIL = "feedback@dopeshot.io";

type UpgradePromptProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function UpgradePrompt({
  title = "Brand features",
  description = "I'm building brand kits so every post you make looks like you — your logo, your colors, your personality. Testimonials, custom backgrounds, and more are on the way. Want early access? Shoot me an email.",
  className,
}: UpgradePromptProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      track("upgrade_email_copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=Request%20Brand%20Beta%20Access`;
    }
  };

  return (
    <div className={cn("rounded-xl border border-border bg-muted/10 p-4", className)}>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-4">
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={handleCopy}
          className="gap-1.5 font-mono text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            CONTACT_EMAIL
          )}
        </Button>
      </div>
    </div>
  );
}
