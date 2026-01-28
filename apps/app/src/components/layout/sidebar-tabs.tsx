"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Palette } from "lucide-react";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { LayoutConfigPanel } from "@/components/config/layout-config";
import { BrandPanel } from "@/components/brand/brand-panel";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { useUserTier } from "@/hooks/use-user-tier";
import { SHOW_LOCKED_BRAND_TAB } from "@/lib/feature-flags-client";
import { track } from "@/lib/analytics";
import { useSession } from "@/lib/auth/auth-client";

type SidebarTab = "design" | "brand";

interface SidebarTabsProps {
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
  onFeedbackClick?: () => void;
}

export function SidebarTabs({ onUploadAsset, onFeedbackClick }: SidebarTabsProps) {
  const { isBrandUser, isLoading } = useUserTier();
  const [activeTab, setActiveTab] = useState<SidebarTab>("design");
  const { data: session } = useSession();
  const hasSession = Boolean(session?.session?.userId);

  // Show Brand tab if:
  // 1. User is logged in AND is a brand user (always show for brand users)
  // 2. OR: User is logged in AND the locked brand tab feature flag is enabled (show locked tab for non-brand users)
  const showBrandTab = hasSession && (isBrandUser || SHOW_LOCKED_BRAND_TAB);

  // Always render Design content if Brand tab is hidden
  const currentTab: SidebarTab = showBrandTab ? activeTab : "design";

  // If the user logs out while on the Brand tab, snap back to Design
  useEffect(() => {
    if (!showBrandTab && activeTab === "brand") {
      setActiveTab("design");
    }
  }, [activeTab, showBrandTab]);

  // Build tab options - only include Brand tab if it should be shown
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

  if (showBrandTab) {
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
      tooltip: isLoading || isBrandUser ? undefined : "Upgrade to Brand to unlock these tools.",
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Tabs - only show segmented control if there are multiple tabs */}
      {tabOptions.length > 1 && (
        <div className="flex-shrink-0 border-b border-border px-4 py-3">
          <SegmentedControl
            value={currentTab}
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
        {currentTab === "design" ? (
          <LayoutConfigPanel onUploadAsset={onUploadAsset} isBrandUser={isBrandUser} />
        ) : (
          <BrandPanel />
        )}
      </div>

      {/* Footer */}
      <SidebarFooter onFeedbackClick={onFeedbackClick} />
    </div>
  );
}
