"use client";
import { AppHeader } from "@/components/app-header";
import { CoverPreview } from "@/components/cover-preview";
import { DragOverlay } from "@/components/drag-overlay";
import { MobileActions } from "@/components/mobile-actions";
import { PlaygroundWorkspace } from "@/components/playground-workspace";
import { LayoutSelector } from "@/components/layout-selector";
import { LayoutConfigPanel } from "@/components/layout-config";
import { usePlaygroundController } from "@/hooks/use-playground-controller";
import { EXPORT_ORIENTATION_DIMENSIONS } from "@/domain/layout/screenshot-mode";
import { orientationAtom } from "@/hooks/atoms";
import { useAtomValue } from "jotai";
import { cn } from "@/utils";

function ExportContainer({ width, height }: { width: number; height: number }) {
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
        visibility: "visible",
        background: "white",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      }}
    >
      <CoverPreview isStatic />
    </div>
  );
}

export default function PlaygroundPage() {
  const orientation = useAtomValue(orientationAtom);

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
          <LayoutConfigPanel onUploadAsset={handleFileProcess} />
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
    </main>
  );
}
