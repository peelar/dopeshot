"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AppHeader } from "@/components/layout/app-header";
import { CoverPreview } from "@/components/cover-preview";
import { DragOverlay } from "@/app/(playground)/_components/drag-overlay";
import { MobileActions } from "@/components/layout/mobile-actions";
import { PlaygroundWorkspace } from "@/app/(playground)/_components/playground-workspace";
import { LayoutSelector } from "@/components/selectors/layout-selector";
import { SidebarTabs } from "@/components/layout/sidebar-tabs";
import { useOnboardingFlow } from "@/hooks/use-onboarding-flow";
import { useBrandLogoAutoApply } from "@/hooks/use-brand-logo-auto-apply";
import { usePlaygroundController } from "@/hooks/use-playground-controller";
import { EXPORT_ORIENTATION_DIMENSIONS, ORIENTATION_DIMENSIONS } from "@/domain/layout/screenshot-mode";
import { orientationAtom, type Orientation } from "@/hooks/atoms";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils/cn";

const OnboardingModal = dynamic(
  () => import("@/components/onboarding/onboarding-modal").then(mod => ({ default: mod.OnboardingModal })),
  { ssr: false }
);

function ExportContainer({ 
  width, 
  height, 
  orientation 
}: { 
  width: number; 
  height: number;
  orientation: Orientation;
}) {
  // Use preview dimensions as base (matching what user sees)
  const baseDims = ORIENTATION_DIMENSIONS[orientation];
  const scale = width / baseDims.width;
  
  return (
    <div
      id="export-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: -100,
        overflow: "hidden",
        visibility: "visible",
        background: "white",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      }}
    >
      <div
        style={{
          width: `${baseDims.width}px`,
          height: `${baseDims.height}px`,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        <CoverPreview isStatic />
      </div>
    </div>
  );
}

type PlaygroundPageProps = {
  showBrandExperience: boolean;
};

export function PlaygroundPage({ showBrandExperience }: PlaygroundPageProps) {
  const orientation = useAtomValue(orientationAtom);
  const { showOnboardingModal, setShowOnboardingModal } = useOnboardingFlow({ enabled: showBrandExperience });

  // Auto-apply brand logo on mount if toggle is enabled
  useBrandLogoAutoApply();

  const {
    dragAndUpload,
    isMobile,
    statusMessage,
    hasCustomScreenshot,
    isProcessingUpload,
    isAnalyzingColors,
    showFocusHint,
    hasScreenshot,
    canExport,
    requiresScreenshot,
    isExporting,
    shouldShowAspectLock,
    isAspectLocked,
    canvas,
    toggleCanvasMode,
    handleExport,
    handleFileProcess,
    isConfigDrawerOpen,
    setIsConfigDrawerOpen,
  } = usePlaygroundController();

  const {
    isDragging,
    uploadInputRef,
    openFilePicker,
    handleFilePickerChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = dragAndUpload;

  return (
    <main
      className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DragOverlay visible={isDragging} />

      <AppHeader
        hasCustomScreenshot={hasCustomScreenshot}
        isProcessingUpload={isProcessingUpload}
        onUploadClick={openFilePicker}
        showUploadButton={requiresScreenshot}
        canExport={canExport}
        onExport={handleExport}
        isExporting={isExporting}
        onBrandClick={undefined}
      />

      {/* Two-column layout: Content (Looks + Preview) | Sidebar */}
      <div className={cn("flex min-h-0 flex-1", isMobile ? "flex-col" : "overflow-hidden")}>
        {/* Left: Content Column (Looks Rail + Preview) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-shrink-0 bg-muted/20 pl-4 sm:pl-8">
            <LayoutSelector />
          </div>

          <div className="flex-shrink-0 border-b border-border pl-4 sm:pl-12" />

          <div className="flex min-h-0 flex-1 overflow-hidden px-4 pb-12 sm:px-8 sm:pb-10">
            <PlaygroundWorkspace
              isMobile={isMobile}
              shouldShowAspectLock={shouldShowAspectLock}
              isAspectLocked={isAspectLocked}
              onToggleAspect={toggleCanvasMode}
              canvasHeight={canvas.height}
              canvasWidth={canvas.width}
              isAnalyzingColors={isAnalyzingColors}
              showFocusHint={showFocusHint}
            />
          </div>
        </div>

        {/* Right: Sidebar - spans full height from below nav */}
        <div className="hidden h-full min-h-0 w-80 overflow-hidden border-l border-border bg-background sm:flex sm:flex-col">
          <SidebarTabs showBrandExperience={showBrandExperience} onUploadAsset={handleFileProcess} />
        </div>
      </div>

      {isMobile ? (
        <MobileActions
          isOpen={isConfigDrawerOpen}
          onOpenChange={setIsConfigDrawerOpen}
          onUploadClick={openFilePicker}
          isProcessingUpload={isProcessingUpload}
          showUploadButton={requiresScreenshot}
          onUploadAsset={handleFileProcess}
        />
      ) : null}

      {canExport ? (
        <ExportContainer
          width={EXPORT_ORIENTATION_DIMENSIONS[orientation].width}
          height={EXPORT_ORIENTATION_DIMENSIONS[orientation].height}
          orientation={orientation}
        />
      ) : null}

      <input
        type="file"
        ref={uploadInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFilePickerChange}
        aria-hidden="true"
        tabIndex={-1}
        disabled={isProcessingUpload}
      />

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      {showBrandExperience ? (
        <OnboardingModal
          open={showOnboardingModal}
          onOpenChange={setShowOnboardingModal}
        />
      ) : null}
    </main>
  );
}
