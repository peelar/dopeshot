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
import { useUserTier } from "@/hooks/use-user-tier";
import {
  EXPORT_ORIENTATION_DIMENSIONS,
  ORIENTATION_DIMENSIONS,
} from "@/domain/layout/screenshot-mode";
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
import { personalBackgroundsAtom } from "@/hooks/atoms/backgrounds";
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
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import {
  OnboardingModal,
  type BrandProfilePayload,
} from "@/components/onboarding/onboarding-modal";
import { listPersonalBackgrounds } from "@/domain/backgrounds/background-service";
import { ExportSuccessModal } from "@/components/post-export";
import { showExportSheetAtom, exportThumbnailAtom } from "@/hooks/atoms";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

const FeedbackModal = dynamic(
  () =>
    import("@/components/feedback/feedback-modal").then((mod) => ({ default: mod.FeedbackModal })),
  { ssr: false },
);

function ExportContainer({
  width,
  height,
  orientation,
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
  initialMemoryItemId?: string;
  initialIsAuthenticated?: boolean;
  initialOnboardingOpen?: boolean;
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
  initialMemoryItemId,
  initialIsAuthenticated,
  initialOnboardingOpen,
}: PlaygroundPageProps) {
  const router = useRouter();
  const orientation = useAtomValue(orientationAtom);
  const config = useAtomValue(configAtom);
  const personalBackgrounds = useAtomValue(personalBackgroundsAtom);
  const [feedbackModalOpen, setFeedbackModalOpen] = useAtom(feedbackModalOpenAtom);
  const [feedbackScreenshot, setFeedbackScreenshot] = useState<string | null>(null);

  // Export success sheet state
  const [showExportSheet, setShowExportSheet] = useAtom(showExportSheetAtom);
  const exportThumbnail = useAtomValue(exportThumbnailAtom);
  const setExportThumbnail = useSetAtom(exportThumbnailAtom);

  const { isBrandUser } = useUserTier();

  // Auto-apply brand logo for NEW designs (not loaded from memory)
  // For loaded designs, brand logo is applied during the load process in useMemory
  useBrandLogoAutoApply({ enabled: isBrandUser });

  // Handle feedback button click - capture screenshot and open modal
  const handleFeedbackClick = async () => {
    const screenshot = await captureFeedbackScreenshot();
    setFeedbackScreenshot(screenshot);
    setFeedbackModalOpen(true);
  };

  // Handle export sheet actions
  const handleExportSheetClose = useCallback(() => {
    setShowExportSheet(false);
    setExportThumbnail(null);
    track("export_sheet_dismissed", {
      dismiss_method: "button",
    });
  }, [setShowExportSheet, setExportThumbnail]);

  const handleExportSheetSignup = useCallback(() => {
    track("export_sheet_signup_clicked");
    setShowExportSheet(false);
    setExportThumbnail(null);
    router.push("/auth");
  }, [router, setShowExportSheet, setExportThumbnail]);

  const handleExportSheetFeedback = useCallback(() => {
    track("export_sheet_feedback_clicked");
    setShowExportSheet(false);
    setExportThumbnail(null);
    setFeedbackScreenshot(null); // Clear stale screenshot to prevent re-sending old canvas
    setFeedbackModalOpen(true);
  }, [setShowExportSheet, setExportThumbnail, setFeedbackModalOpen]);

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

  const {
    shouldRedirectToOnboarding,
    isLoading: isOnboardingLoading,
    refresh: refreshOnboardingStatus,
  } = useOnboardingStatus({ enabled: Boolean(session?.user) });

  const [onboardingProfile, setOnboardingProfile] = useState<BrandProfilePayload | null>(null);
  const [hasLoadedOnboardingProfile, setHasLoadedOnboardingProfile] = useState(false);
  const [isOnboardingProfileLoading, setIsOnboardingProfileLoading] = useState(false);
  const [hasOpenedInitialOnboarding, setHasOpenedInitialOnboarding] = useState(false);

  const loadOnboardingProfile = useCallback(async () => {
    if (!session?.user || isOnboardingProfileLoading) return;
    setIsOnboardingProfileLoading(true);

    try {
      const response = await fetch("/api/brand/profile", { credentials: "include" });
      const payload = (await response.json()) as BrandProfilePayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load brand profile");
      }
      setOnboardingProfile(payload);
    } catch {
      setOnboardingProfile(null);
    } finally {
      setHasLoadedOnboardingProfile(true);
      setIsOnboardingProfileLoading(false);
    }
  }, [isOnboardingProfileLoading, session?.user]);

  const shouldOpenFromInitial = Boolean(initialOnboardingOpen) && !hasOpenedInitialOnboarding;
  const shouldOpenOnboarding = isLoggedIn && (shouldRedirectToOnboarding || shouldOpenFromInitial);

  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (!shouldOpenOnboarding) return;
    if (hasLoadedOnboardingProfile || isOnboardingProfileLoading) return;
    void loadOnboardingProfile();
  }, [
    hasLoadedOnboardingProfile,
    isOnboardingProfileLoading,
    loadOnboardingProfile,
    shouldOpenOnboarding,
  ]);

  useEffect(() => {
    if (!shouldOpenOnboarding || !hasLoadedOnboardingProfile) return;
    setOnboardingOpen(true);
    if (shouldOpenFromInitial) {
      setHasOpenedInitialOnboarding(true);
    }
  }, [hasLoadedOnboardingProfile, shouldOpenFromInitial, shouldOpenOnboarding]);

  useEffect(() => {
    if (onboardingOpen && !isOnboardingLoading && !shouldRedirectToOnboarding) {
      setOnboardingOpen(false);
    }
  }, [isOnboardingLoading, onboardingOpen, shouldRedirectToOnboarding]);

  const setConfig = useSetAtom(baseConfigAtom);
  const setAssets = useSetAtom(assetsAtom);
  const setScreenshotGradient = useSetAtom(screenshotGradientAtom);
  const setScreenshotZoom = useSetAtom(screenshotZoomAtom);
  const setHasCustomScreenshot = useSetAtom(hasCustomScreenshotAtom);
  const setLoadedItemId = useSetAtom(loadedMemoryItemIdAtom);
  const setPersonalBackgrounds = useSetAtom(personalBackgroundsAtom);

  const hasBootstrappedRef = useRef(false);
  const lastInitialMemoryItemIdRef = useRef<string | null>(null);
  const prefetchBackgroundsHandleRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      hasBootstrappedRef.current = false;
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

    // Fetch memory items for sidebar in background (non-blocking)
    // Users should see empty state on app open
    fetchMemoryItems().catch((error) => {
      console.error("Failed to bootstrap memory items:", error);
    });
  }, [fetchMemoryItems, initialMemoryItemId, isLoggedIn, loadedItemId, resetToEmptyCanvas]);

  // Prefetch personal backgrounds after critical bootstraps finish.
  // Runs only for logged-in brand users and schedules on idle/timeout to stay out of the critical path.
  useEffect(() => {
    if (!isLoggedIn || !isBrandUser) return;
    if (personalBackgrounds.length > 0) return;

    const prefetch = () => {
      listPersonalBackgrounds()
        .then((response) => setPersonalBackgrounds(response.items))
        .catch((error) => {
          // Non-blocking; log for diagnostics only.
          console.error("Background prefetch failed:", error);
        });
    };

    if (typeof window !== "undefined") {
      const hasIdleCallback = "requestIdleCallback" in window;
      if (hasIdleCallback) {
        prefetchBackgroundsHandleRef.current = window.requestIdleCallback(prefetch, {
          timeout: 3000,
        });
      } else {
        // In browser context, setTimeout returns a number (not Node's Timeout object)
        prefetchBackgroundsHandleRef.current = Number(window.setTimeout(prefetch, 1200));
      }
    }

    return () => {
      if (prefetchBackgroundsHandleRef.current === null) return;
      if (typeof window !== "undefined") {
        const hasIdleCallback = "cancelIdleCallback" in window;
        if (hasIdleCallback) {
          window.cancelIdleCallback(prefetchBackgroundsHandleRef.current);
        } else {
          window.clearTimeout(prefetchBackgroundsHandleRef.current);
        }
      }
    };
  }, [isBrandUser, isLoggedIn, personalBackgrounds.length, setPersonalBackgrounds]);

  useEffect(() => {
    if (!initialMemoryItemId || !isLoggedIn) {
      return;
    }

    if (lastInitialMemoryItemIdRef.current === initialMemoryItemId) {
      return;
    }

    lastInitialMemoryItemIdRef.current = initialMemoryItemId;

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

  // Only show loading when actually loading a specific memory item from URL
  const showLoadingState = isLoggedIn && Boolean(initialMemoryItemId) && !loadedItemId;

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

  // Gate first brand session with a quick setup modal.
  // Keeps the editor accessible without a route redirect and still ensures onboarding happens.
  const shouldShowOnboardingModal = onboardingOpen && isLoggedIn;

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

      <OnboardingModal
        open={shouldShowOnboardingModal}
        profile={onboardingProfile}
        onOpenChange={(next) => setOnboardingOpen(next)}
        required
        onCompleted={() => {
          setOnboardingOpen(false);
          void refreshOnboardingStatus();
        }}
      />

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
                hasScreenshot={hasScreenshot}
              />
            </div>
          </div>
        </PlaygroundErrorBoundary>

        {/* Right: Sidebar - spans full height from below nav */}
        <SidebarErrorBoundary>
          <div className="hidden h-full min-h-0 w-80 overflow-hidden border-l border-border bg-background sm:flex sm:flex-col">
            <SidebarTabs onUploadAsset={handleFileProcess} onFeedbackClick={handleFeedbackClick} />
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
          isBrandUser={isBrandUser}
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

      <ExportSuccessModal
        isOpen={showExportSheet}
        onClose={handleExportSheetClose}
        onSignup={handleExportSheetSignup}
        onFeedback={handleExportSheetFeedback}
        thumbnailUrl={exportThumbnail ?? undefined}
      />
    </main>
  );
}
