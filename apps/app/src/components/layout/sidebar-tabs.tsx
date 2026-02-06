"use client";

import { useAtomValue } from "jotai";
import { Paintbrush } from "lucide-react";
import { LayoutConfigPanel } from "@/components/config/layout-config";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { activeFormatAtom } from "@/hooks/atoms";
import { useUserTier } from "@/hooks/use-user-tier";

interface SidebarTabsProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background" | "avatar") => void;
  onFeedbackClick?: () => void;
}

export function SidebarTabs({ onUploadAsset, onFeedbackClick }: SidebarTabsProps) {
  const { isBrandUser } = useUserTier();
  const activeFormat = useAtomValue(activeFormatAtom);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        {activeFormat === "none" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Paintbrush className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground/60">
              Pick a format to start designing
            </p>
          </div>
        ) : (
          <LayoutConfigPanel onUploadAsset={onUploadAsset} isBrandUser={isBrandUser} />
        )}
      </div>
      <SidebarFooter onFeedbackClick={onFeedbackClick} />
    </div>
  );
}
