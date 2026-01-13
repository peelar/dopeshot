"use client";

import { useState } from "react";
import { LayoutGrid, Palette } from "lucide-react";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { LayoutConfigPanel } from "@/components/config/layout-config";
import { BrandPanel } from "@/components/brand/brand-panel";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { useUserTier } from "@/hooks/use-user-tier";
import { SHOW_BRAND_TAB } from "@/lib/feature-flags-client";
import { track } from "@/lib/analytics";

type SidebarTab = "design" | "brand";

interface SidebarTabsProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  onFeedbackClick?: () => void;
}

export function SidebarTabs({ onUploadAsset, onFeedbackClick }: SidebarTabsProps) {
  const { isBrandUser, isLoading } = useUserTier();
  const [activeTab, setActiveTab] = useState<SidebarTab>("design");

  // Build tab options - only include Brand tab if feature flag is enabled
  const tabOptions: SegmentedOption[] = [
    {
      id: "design",
      label: (
        <span className="flex items-center justify-center gap-2">
          <LayoutGrid className="size-4" aria-hidden="true" />
          Design
        </span>
      ),
    },
  ];

  if (SHOW_BRAND_TAB) {
    tabOptions.push({
      id: "brand",
      label: (
        <span className="flex items-center justify-center gap-2">
          <Palette className="size-4" aria-hidden="true" />
          Brand
        </span>
      ),
      // Disable while loading or if user is not a brand user
      disabled: isLoading || !isBrandUser,
      tooltip: isLoading ? undefined : "Upgrade to Brand to unlock these tools.",
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Tabs - only show segmented control if there are multiple tabs */}
      {tabOptions.length > 1 && (
        <div className="flex-shrink-0 border-b border-border px-4 py-3">
          <SegmentedControl
            value={activeTab}
            options={tabOptions}
            onChange={(value) => {
              const nextTab = value as SidebarTab;
              setActiveTab(nextTab);
              track("sidebar_tab_selected", { tab: nextTab });
            }}
            ariaLabel="Sidebar tabs"
          />
        </div>
      )}

      {/* Tab content - scrollable */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
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
