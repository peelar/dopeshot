"use client";

import { useEffect, useMemo, useState } from "react";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { LayoutConfigPanel } from "@/components/config/layout-config";
import { BrandPanel } from "@/components/brand/brand-panel";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { useUserTier } from "@/hooks/use-user-tier";
import { SHOW_BRAND_TAB } from "@/lib/feature-flags-client";

type SidebarTab = "design" | "brand";

interface SidebarTabsProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  onFeedbackClick?: () => void;
}

export function SidebarTabs({ onUploadAsset, onFeedbackClick }: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("design");
  const { isBrandUser, isLoading } = useUserTier();

  useEffect(() => {
    if ((!SHOW_BRAND_TAB || !isBrandUser) && activeTab === "brand") {
      setActiveTab("design");
    }
  }, [activeTab, isBrandUser, SHOW_BRAND_TAB]);

  // Build tab options - only include Brand tab if feature flag is enabled
  const tabOptions = useMemo((): SegmentedOption[] => {
    const options: SegmentedOption[] = [{ id: "design", label: "Design" }];

    if (SHOW_BRAND_TAB) {
      options.push({
        id: "brand",
        label: "Brand",
        // Disable while loading or if user is not a brand user
        disabled: isLoading || !isBrandUser,
        tooltip: isLoading ? undefined : "Upgrade to Brand to unlock these tools.",
      });
    }

    return options;
  }, [isBrandUser, isLoading, SHOW_BRAND_TAB]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Tabs - only show segmented control if there are multiple tabs */}
      {tabOptions.length > 1 && (
        <div className="flex-shrink-0 border-b border-border px-4 py-3">
          <SegmentedControl
            value={activeTab}
            options={tabOptions}
            onChange={(value) => setActiveTab(value as SidebarTab)}
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
