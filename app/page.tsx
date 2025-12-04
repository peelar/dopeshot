"use client";

import { AppHeader } from "@/components/app-header";
import { CoverPreview } from "@/components/cover-preview";
import { DragOverlay } from "@/components/drag-overlay";
import { MobileActions } from "@/components/mobile-actions";
import { PlaygroundWorkspace } from "@/components/playground-workspace";
import { TemplateSelector } from "@/components/template-selector";
import { usePlaygroundController } from "@/hooks/use-playground-controller";

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
  const {
    dragAndUpload,
    isMobile,
    statusMessage,
    hasCustomScreenshot,
    isProcessingUpload,
    isAnalyzingColors,
    showFocusHint,
    hasScreenshot,
    isExporting,
    showLayoutToggle,
    shouldShowAspectLock,
    isAspectLocked,
    canvas,
    handleVariantChange,
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
      className="relative flex min-h-screen flex-col bg-background text-foreground"
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
        hasScreenshot={hasScreenshot}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <div className="flex flex-1 flex-col gap-4 px-4 pb-12 pt-4 sm:px-8 sm:pb-10">
        <TemplateSelector />

        <PlaygroundWorkspace
          isMobile={isMobile}
          showLayoutToggle={showLayoutToggle}
          onVariantChange={handleVariantChange}
          shouldShowAspectLock={shouldShowAspectLock}
          isAspectLocked={isAspectLocked}
          onToggleAspect={toggleCanvasMode}
          canvasHeight={canvas.height}
          canvasWidth={canvas.width}
          isAnalyzingColors={isAnalyzingColors}
          onUploadAsset={handleFileProcess}
          showFocusHint={showFocusHint}
        />
      </div>

      {isMobile ? (
        <MobileActions
          isOpen={isConfigDrawerOpen}
          onOpenChange={setIsConfigDrawerOpen}
          onUploadClick={openFilePicker}
          isProcessingUpload={isProcessingUpload}
          onUploadAsset={handleFileProcess}
        />
      ) : null}

      {hasScreenshot ? <ExportContainer width={canvas.width} height={canvas.height} /> : null}

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
