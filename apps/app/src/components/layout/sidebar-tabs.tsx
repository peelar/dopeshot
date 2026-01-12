"use client";

import { useEffect, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { LayoutConfigPanel } from "@/components/config/layout-config";
import { BrandPanel } from "@/components/brand/brand-panel";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { useUserTier } from "@/hooks/use-user-tier";

type SidebarTab = "design" | "brand";

interface SidebarTabsProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  onFeedbackClick?: () => void;
}

export function SidebarTabs({ onUploadAsset, onFeedbackClick }: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("design");
  const { isBrandUser } = useUserTier();

  useEffect(() => {
    if (!isBrandUser && activeTab === "brand") {
      setActiveTab("design");
    }
  }, [activeTab, isBrandUser]);

  // When brand experience is off, render design sidebar directly (no tabs)
  if (!isBrandUser) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <LayoutConfigPanel onUploadAsset={onUploadAsset} />
        </div>
        <SidebarFooter onFeedbackClick={onFeedbackClick} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-border px-4 py-3">
        <SegmentedControl
          value={activeTab}
          options={[
            { id: "design", label: "Design" },
            { id: "brand", label: "Brand" },
          ]}
          onChange={(value) => setActiveTab(value as SidebarTab)}
          ariaLabel="Sidebar tabs"
        />
      </div>

      {/* Tab content - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "design" ? (
          <LayoutConfigPanel onUploadAsset={onUploadAsset} />
        ) : (
          <BrandPanel />
        )}
      </div>

      {/* Footer */}
      <SidebarFooter onFeedbackClick={onFeedbackClick} />
    </div>
  );
}
