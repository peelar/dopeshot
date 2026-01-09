"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AppHeader } from "@/components/layout/app-header";
import { CoverPreview } from "@/components/cover-preview";
import { DragOverlay } from "@/app/(playground)/_components/drag-overlay";
import { MobileActions } from "@/components/layout/mobile-actions";
import { PlaygroundWorkspace } from "@/app/(playground)/_components/playground-workspace";
import { LayoutSelector } from "@/components/selectors/layout-selector";
import { SidebarTabs } from "@/components/layout/sidebar-tabs";
import { useBrandLogoAutoApply } from "@/hooks/use-brand-logo-auto-apply";
import { usePlaygroundController } from "@/hooks/use-playground-controller";
import { EXPORT_ORIENTATION_DIMENSIONS, ORIENTATION_DIMENSIONS } from "@/domain/layout/screenshot-mode";
import {
  assetsAtom,
  baseConfigAtom,
  configAtom,
  feedbackModalOpenAtom,
  getEmptyCanvasConfig,
  hasCustomScreenshotAtom,
  hasExportedAtom,
  orientationAtom,
  screenshotGradientAtom,
  screenshotZoomAtom,
  type Orientation,
} from "@/hooks/atoms";
import { loadedMemoryItemIdAtom } from "@/hooks/atoms/memory";
import { getDefaultDemoPreset } from "@/domain/demo/presets";
import { Provider as JotaiProvider, createStore, useAtom, useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils/cn";
import { captureFeedbackScreenshot } from "@/components/feedback/capture-screenshot";
import { MemorySidebar } from "@/components/memory/memory-sidebar";
import { useMemory } from "@/hooks/use-memory";
import { useSession } from "@/lib/auth/auth-client";
import { useSaveDesign } from "@/hooks/use-save-design";
import { useExportStateReset } from "@/hooks/use-export-state-reset";
import { PlaygroundErrorBoundary } from "@/components/errors/playground-error-boundary";
import { SidebarErrorBoundary } from "@/components/errors/sidebar-error-boundary";
import { MemoryErrorBoundary } from "@/components/errors/memory-error-boundary";
import { InAppUpdateBanner } from "@/components/layout/in-app-update-banner";

const FeedbackModal = dynamic(
  () => import("@/components/feedback/feedback-modal").then(mod => ({ default: mod.FeedbackModal })),
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: `${baseDims.width}px`,
            height: `${baseDims.height}px`,
            transformOrigin: "center",
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
  initialMemoryItemId?: string;
  initialIsAuthenticated?: boolean;
};

export function PlaygroundPage(props: PlaygroundPageProps) {
  const store = useMemo(() => {
    const nextStore = createStore();

    if (props.initialIsAuthenticated) {
      nextStore.set(baseConfigAtom, getEmptyCanvasConfig());
      nextStore.set(assetsAtom, []);
      return nextStore;
    }

    const preset = getDefaultDemoPreset();
    nextStore.set(baseConfigAtom, preset.config);
    nextStore.set(assetsAtom, [preset.asset]);
    return nextStore;
  }, [props.initialIsAuthenticated]);

  return (
    <JotaiProvider store={store}>
      <PlaygroundPageInner {...props} />
    </JotaiProvider>
  );
}

function PlaygroundPageInner({
  showBrandExperience,
  initialMemoryItemId,
  initialIsAuthenticated,
}: PlaygroundPageProps) {
  const orientation = useAtomValue(orientationAtom);
  const config = useAtomValue(configAtom);
  const [feedbackModalOpen, setFeedbackModalOpen] = useAtom(feedbackModalOpenAtom);
  const [feedbackScreenshot, setFeedbackScreenshot] = useState<string | null>(null);

  // Auto-apply brand logo on mount if toggle is enabled
  useBrandLogoAutoApply({ enabled: showBrandExperience });

  // Handle feedback button click - capture screenshot and open modal
  const handleFeedbackClick = async () => {
    const screenshot = await captureFeedbackScreenshot();
    setFeedbackScreenshot(screenshot);
    setFeedbackModalOpen(true);
  };
  // Memory hook for loading items
  const {
    loadMemoryItem,
    fetchMemoryItems,
    deleteDesign,
    resetToEmptyCanvas,
    isLoading: isMemoryLoading,
  } = useMemory();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user) || Boolean(initialIsAuthenticated);
  const loadedItemId = useAtomValue(loadedMemoryItemIdAtom);
  const [isBootstrappingMemory, setIsBootstrappingMemory] = useState(() => Boolean(initialIsAuthenticated));

  const setConfig = useSetAtom(baseConfigAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);
  const setHasCustomScreenshot = useSetAtom(hasCustomScreenshotAtom);
  const setLoadedItemId = useSetAtom(loadedMemoryItemIdAtom);

  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) {
      hasBootstrappedRef.current = false;
      setIsBootstrappingMemory(false);
      return;
    }

    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;

    // Ensure logged-in users never keep demo state (e.g., after signing in mid-session)
    if (!initialMemoryItemId && !loadedItemId) {
      resetToEmptyCanvas();
    }

    setIsBootstrappingMemory(true);

    fetchMemoryItems()
      .then(({ items }) => {
        if (initialMemoryItemId || loadedItemId) return;
        if (items.length === 0) return;

        const mostRecent = items.reduce((latest, item) => {
          if (!latest) return item;
          return new Date(item.createdAt).getTime() > new Date(latest.createdAt).getTime() ? item : latest;
        }, items[0]);

        return loadMemoryItem(mostRecent.id);
      })
      .catch((error) => {
        console.error("Failed to bootstrap memory items:", error);
      })
      .finally(() => {
        setIsBootstrappingMemory(false);
      });
  }, [fetchMemoryItems, initialMemoryItemId, isLoggedIn, loadMemoryItem, loadedItemId, resetToEmptyCanvas]);

  useEffect(() => {
    if (!initialMemoryItemId || !isLoggedIn) {
      return;
    }

    loadMemoryItem(initialMemoryItemId).catch((error) => {
      console.error("Failed to load memory item from URL:", error);
    });
  }, [initialMemoryItemId, isLoggedIn, loadMemoryItem]);

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
  } = usePlaygroundController({ demoEnabled: !isLoggedIn });

  const showLoadingState = isLoggedIn && (isBootstrappingMemory || (isMemoryLoading && !loadedItemId));

  const showEmptyState = useMemo(() => {
    const hasText = Boolean(config.text.title?.trim() || config.text.subtitle?.trim());
    const hasAssets = Boolean(
      config.assets.screenshot || config.assets.logo || config.assets.background,
    );

    return !showLoadingState && requiresScreenshot && !hasText && !hasAssets;
  }, [
    config.assets.background,
    config.assets.logo,
    config.assets.screenshot,
    config.text.subtitle,
    config.text.title,
    requiresScreenshot,
    showLoadingState,
  ]);

  // Save design hooks
  const { saveDesign, canSave, isAtLimit, isSaving, saveCount, saveLimit } = useSaveDesign();
  const hasExported = useAtomValue(hasExportedAtom);
  useExportStateReset(); // Auto-reset on design changes

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

      <InAppUpdateBanner />

      <AppHeader
        isLoggedIn={isLoggedIn}
        hasSelectedSavedDesign={Boolean(loadedItemId)}
        hasCustomScreenshot={hasCustomScreenshot}
        isProcessingUpload={isProcessingUpload}
        onUploadClick={openFilePicker}
        onNewClick={resetToEmptyCanvas}
        showUploadButton={requiresScreenshot}
        canExport={canExport}
        onExport={handleExport}
        isExporting={isExporting}
        onSave={saveDesign}
        isSaving={isSaving}
        canSave={canSave}
        isAtSaveLimit={isAtLimit}
        saveCount={saveCount}
        saveLimit={saveLimit}
        onBrandClick={undefined}
        onFeedbackClick={handleFeedbackClick}
      />

      {/* Three-column layout: Memory Sidebar | Content (Looks + Preview) | Design Sidebar */}
      <div className={cn("flex min-h-0 flex-1", isMobile ? "flex-col" : "overflow-hidden")}>
        {/* Left: Memory Sidebar (collapsible) */}
        <MemoryErrorBoundary>
          <MemorySidebar onLoadItem={loadMemoryItem} onDeleteItem={deleteDesign} />
        </MemoryErrorBoundary>

        {/* Center: Content Column (Looks Rail + Preview) */}
        <PlaygroundErrorBoundary>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-muted/20 pl-4 sm:pl-8">
              <LayoutSelector />
            </div>

            <div className="flex-shrink-0 border-b border-border pl-4 sm:pl-12" />

            <div className="flex min-h-0 flex-1 overflow-hidden px-4 pb-12 sm:px-8 sm:pb-10">
              <PlaygroundWorkspace
                shouldShowAspectLock={shouldShowAspectLock}
                isAspectLocked={isAspectLocked}
                onToggleAspect={toggleCanvasMode}
                showEmptyState={showEmptyState}
                showLoadingState={showLoadingState}
                onEmptyStateClick={openFilePicker}
                canvasHeight={canvas.height}
                canvasWidth={canvas.width}
                isAnalyzingColors={isAnalyzingColors}
                showFocusHint={showFocusHint}
              />
            </div>
          </div>
        </PlaygroundErrorBoundary>

        {/* Right: Sidebar - spans full height from below nav */}
        <SidebarErrorBoundary>
          <div className="hidden h-full min-h-0 w-80 overflow-hidden border-l border-border bg-background sm:flex sm:flex-col">
            <SidebarTabs
              showBrandExperience={showBrandExperience}
              onUploadAsset={handleFileProcess}
              onFeedbackClick={handleFeedbackClick}
            />
          </div>
        </SidebarErrorBoundary>
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
        data-testid="file-upload-input"
      />

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      <FeedbackModal
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
        screenshotDataUrl={feedbackScreenshot}
      />
    </main>
  );
}
