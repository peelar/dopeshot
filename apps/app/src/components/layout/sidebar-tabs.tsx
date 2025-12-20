"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { LayoutConfigPanel } from "@/components/config/layout-config";
import { BrandPanel } from "@/components/brand/brand-panel";

type SidebarTab = "design" | "brand";

interface SidebarTabsProps {
  showBrandExperience: boolean;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background") => void;
}

export function SidebarTabs({ showBrandExperience, onUploadAsset }: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("design");

  // When brand experience is off, render design sidebar directly (no tabs)
  if (!showBrandExperience) {
    return <LayoutConfigPanel onUploadAsset={onUploadAsset} />;
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

      {/* Tab content */}
      {activeTab === "design" ? (
        <LayoutConfigPanel onUploadAsset={onUploadAsset} />
      ) : (
        <BrandPanel />
      )}
    </div>
  );
}

