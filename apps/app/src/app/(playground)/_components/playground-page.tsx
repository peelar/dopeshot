"use client";

import { useCallback, useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { CoverPreview } from "@/components/cover-preview";
import { DragOverlay } from "@/app/(playground)/_components/drag-overlay";
import { MobileActions } from "@/components/layout/mobile-actions";
import { PlaygroundWorkspace } from "@/app/(playground)/_components/playground-workspace";
import { LayoutSelector } from "@/components/selectors/layout-selector";
import { SidebarTabs } from "@/components/layout/sidebar-tabs";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { useBrandLogoAutoApply } from "@/hooks/use-brand-logo-auto-apply";
import { usePlaygroundController } from "@/hooks/use-playground-controller";
import {
  getExportDimensionsForLayout,
  ORIENTATION_DIMENSIONS,
} from "@/domain/layout/screenshot-mode";
import {
  LAYOUT_DEFINITIONS,
  getLayoutFormat,
  withLayoutTextDefaults,
  type LayoutFormat,
} from "@/domain/layout-def/definitions";
import {
  activeFormatAtom,
  assetsAtom,
  baseConfigAtom,
  configAtom,
  orientationAtom,
  screenshotZoomAtom,
} from "@/hooks/atoms";
import { getDefaultDemoPreset, getRandomDemoPreset } from "@/domain/demo/presets";
import { Provider as JotaiProvider, createStore, useAtom, useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";
import { PlaygroundErrorBoundary } from "@/components/errors/playground-error-boundary";
import { SidebarErrorBoundary } from "@/components/errors/sidebar-error-boundary";
import { ExportSuccessModal } from "@/components/post-export";
import { showExportSheetAtom, exportThumbnailAtom } from "@/hooks/atoms";
import { useColorAnalysis } from "@/hooks/use-color-analysis";
import { useExportStateReset } from "@/hooks/use-export-state-reset";

function ExportContainer({
  width,
  height,
  baseWidth,
  baseHeight,
}: {
  width: number;
  height: number;
  baseWidth: number;
  baseHeight: number;
}) {
  const scale = width / baseWidth;

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
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transformOrigin: "center",
          transform: `scale(${scale})`,
        }}
      >
        <CoverPreview isStatic />
      </div>
    </div>
  );
}

export function PlaygroundPage() {
  const store = useMemo(() => {
    const nextStore = createStore();
    const preset = getDefaultDemoPreset();
    nextStore.set(baseConfigAtom, preset.config);
    nextStore.set(assetsAtom, [preset.asset]);
    nextStore.set(activeFormatAtom, "screenshot");
    return nextStore;
  }, []);

  return (
    <JotaiProvider store={store}>
      <PlaygroundPageInner />
    </JotaiProvider>
  );
}

function PlaygroundPageInner() {
  const orientation = useAtomValue(orientationAtom);
  const config = useAtomValue(configAtom);
  const [isPreparingScreenshotPreset, setIsPreparingScreenshotPreset] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);

  const [showExportSheet, setShowExportSheet] = useAtom(showExportSheetAtom);
  const exportThumbnail = useAtomValue(exportThumbnailAtom);
  const setExportThumbnail = useSetAtom(exportThumbnailAtom);

  useBrandLogoAutoApply();
  useExportStateReset();

  const handleExportSheetClose = useCallback(() => {
    setShowExportSheet(false);
    setExportThumbnail(null);
    track("export_sheet_dismissed", {
      dismiss_method: "button",
    });
  }, [setShowExportSheet, setExportThumbnail]);

  const setConfig = useSetAtom(baseConfigAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);

  const {
    dragAndUpload,
    isMobile,
    statusMessage,
    hasCustomScreenshot,
    isProcessingUpload,
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
  } = usePlaygroundController({ demoEnabled: true });
  const { processColorAnalysis } = useColorAnalysis();
  const layoutFormat = getLayoutFormat(config.layoutId);
  const exportDimensions = useMemo(
    () => getExportDimensionsForLayout(config, orientation),
    [config, orientation],
  );
  const exportBaseDimensions = useMemo(
    () =>
      layoutFormat === "testimonial"
        ? { width: canvas.width, height: canvas.height }
        : ORIENTATION_DIMENSIONS[orientation],
    [canvas.height, canvas.width, layoutFormat, orientation],
  );

  const showLoadingState = isPreparingScreenshotPreset;

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

  const [activeFormat, setActiveFormat] = useAtom(activeFormatAtom);
  const isFormatChosen = activeFormat !== "none";
  const handleFormatChosen = useCallback(
    (format: LayoutFormat) => {
      if (format === "screenshot") {
        setIsPreparingScreenshotPreset(true);
        const demoPreset = getRandomDemoPreset();
        setConfig(demoPreset.config);
        setAssets([demoPreset.asset]);
        setScreenshotZoom(1.0);
        void (async () => {
          try {
            await processColorAnalysis(demoPreset.asset.url, demoPreset.asset.id, null);
          } finally {
            setActiveFormat("screenshot");
            setIsPreparingScreenshotPreset(false);
            track("format_tab_switched", { from: "none", to: format });
          }
        })();
        return;
      }

      const firstLayout = LAYOUT_DEFINITIONS.find((l) => l.format === format);
      if (firstLayout) {
        const nextConfig = withLayoutTextDefaults(firstLayout.createConfig());
        setConfig(nextConfig);
        setScreenshotZoom(1.0);
        track("format_tab_switched", { from: "none", to: format });
      }
    },
    [processColorAnalysis, setActiveFormat, setAssets, setConfig, setScreenshotZoom],
  );

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
        canExport={canExport}
        onExport={handleExport}
        isExporting={isExporting}
        onLeftSidebarToggle={() => setLeftSidebarOpen((prev) => !prev)}
        leftSidebarOpen={leftSidebarOpen}
      />

      <div className={cn("flex min-h-0 flex-1", isMobile ? "flex-col" : "overflow-hidden")}>
        <LeftSidebar isOpen={leftSidebarOpen} onOpenChange={setLeftSidebarOpen} isMobile={isMobile} />

        <PlaygroundErrorBoundary>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "flex-shrink-0 pl-4 sm:pl-8",
                isFormatChosen ? "bg-muted/20" : "bg-transparent",
              )}
            >
              <LayoutSelector />
            </div>
            <div
              className={cn(
                "flex-shrink-0 border-b pl-4 sm:pl-12",
                isFormatChosen ? "border-border" : "border-transparent",
              )}
            />

            <div className="flex min-h-0 flex-1 overflow-hidden px-4 pb-12 sm:px-8 sm:pb-10">
              <PlaygroundWorkspace
                shouldShowAspectLock={shouldShowAspectLock}
                isAspectLocked={isAspectLocked}
                onToggleAspect={toggleCanvasMode}
                showEmptyState={showEmptyState}
                showLoadingState={showLoadingState}
                onEmptyStateClick={openFilePicker}
                onFormatChosen={handleFormatChosen}
                canvasHeight={canvas.height}
                canvasWidth={canvas.width}
                showFocusHint={showFocusHint}
                hasScreenshot={hasScreenshot}
              />
            </div>
          </div>
        </PlaygroundErrorBoundary>

        <SidebarErrorBoundary>
          <div className="hidden h-full min-h-0 w-80 overflow-hidden border-l border-border bg-background sm:flex sm:flex-col">
            <SidebarTabs onUploadAsset={handleFileProcess} />
          </div>
        </SidebarErrorBoundary>
      </div>

      {isMobile && isFormatChosen ? (
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
          width={exportDimensions.width}
          height={exportDimensions.height}
          baseWidth={exportBaseDimensions.width}
          baseHeight={exportBaseDimensions.height}
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

      <ExportSuccessModal
        isOpen={showExportSheet}
        onClose={handleExportSheetClose}
        thumbnailUrl={exportThumbnail ?? undefined}
      />
    </main>
  );
}
