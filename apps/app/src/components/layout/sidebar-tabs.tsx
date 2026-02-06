"use client";

import { LayoutConfigPanel } from "@/components/config/layout-config";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { useUserTier } from "@/hooks/use-user-tier";

interface SidebarTabsProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background" | "avatar") => void;
  onFeedbackClick?: () => void;
}

export function SidebarTabs({ onUploadAsset, onFeedbackClick }: SidebarTabsProps) {
  const { isBrandUser } = useUserTier();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        <LayoutConfigPanel onUploadAsset={onUploadAsset} isBrandUser={isBrandUser} />
      </div>
      <SidebarFooter onFeedbackClick={onFeedbackClick} />
    </div>
  );
}
