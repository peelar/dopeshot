"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const LayoutConfig = () => {
  const [textPosition, setTextPosition] = useState<{
    horizontal: "left" | "center" | "right";
    vertical: "top" | "middle" | "bottom";
  }>({
    horizontal: "left",
    vertical: "top",
  });

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">Layout Configuration</h3>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-600">Text Position</Label>
              <div className="mt-2 space-y-2">
                <div>
                  <Label className="text-xs text-slate-500">Horizontal</Label>
                  <div className="mt-1 flex gap-2">
                    {(["left", "center", "right"] as const).map((pos) => (
                      <Button
                        key={pos}
                        variant={textPosition.horizontal === pos ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTextPosition((prev) => ({ ...prev, horizontal: pos }))}
                        className="flex-1 capitalize"
                      >
                        {pos}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Vertical</Label>
                  <div className="mt-1 flex gap-2">
                    {(["top", "middle", "bottom"] as const).map((pos) => (
                      <Button
                        key={pos}
                        variant={textPosition.vertical === pos ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTextPosition((prev) => ({ ...prev, vertical: pos }))}
                        className="flex-1 capitalize"
                      >
                        {pos}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <Label className="text-xs text-slate-600">Additional Controls</Label>
            <p className="text-xs text-slate-500">More layout options coming soon...</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
