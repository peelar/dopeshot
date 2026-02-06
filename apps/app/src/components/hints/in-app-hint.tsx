"use client";

import { useEffect, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type InAppHintProps = {
  hintText: React.ReactNode;
  fallbackText?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  persistKey?: string;
};

export function InAppHint({
  hintText,
  fallbackText,
  children,
  defaultOpen = true,
  side = "right",
  align = "center",
  persistKey,
}: InAppHintProps) {
  const [hintOpen, setHintOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!persistKey) return;
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(persistKey) === "1";
    if (dismissed) {
      setHintOpen(false);
      return;
    }
    setHintOpen(defaultOpen);
  }, [defaultOpen, persistKey]);

  const handleHintOpenChange = (next: boolean) => {
    if (next) return;
    setHintOpen(false);
    if (persistKey && typeof window !== "undefined") {
      window.localStorage.setItem(persistKey, "1");
    }
  };

  if (hintOpen) {
    return (
      <Tooltip open={hintOpen} onOpenChange={handleHintOpenChange}>
        <TooltipTrigger render={(props) => <span {...props}>{children}</span>} />
        <TooltipContent side={side} align={align}>
          {hintText}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (fallbackText) {
    return (
      <Tooltip>
        <TooltipTrigger render={(props) => <span {...props}>{children}</span>} />
        <TooltipContent side={side} align={align}>
          {fallbackText}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <>{children}</>;
}
