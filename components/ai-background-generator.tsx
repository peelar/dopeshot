"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIBackgroundGenerator() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-6 text-center">
        <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="mb-2 text-sm font-medium text-foreground">AI Background Generation</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Generate unique backgrounds using best-in-class AI image models.
        </p>
        <Button disabled className="w-full">
          Coming Soon
        </Button>
      </div>
    </div>
  );
}
