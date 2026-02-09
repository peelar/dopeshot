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
import { LeftSidebar, type LeftSidebarView } from "@/components/layout/left-sidebar";
import { useBrandLogoAutoApply } from "@/hooks/use-brand-logo-auto-apply";
import { usePlaygroundController } from "@/hooks/use-playground-controller";
import { useUserTier } from "@/hooks/use-user-tier";
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
  feedbackModalOpenAtom,
  getEmptyCanvasConfig,
  hasCustomScreenshotAtom,
  hasExportedAtom,
  orientationAtom,
  previewModeAtom,
  screenshotGradientAtom,
  screenshotZoomAtom,
  type PreviewMode,
} from "@/hooks/atoms";
import { personalBackgroundsAtom } from "@/hooks/atoms/backgrounds";
import { supportsVideo } from "@/domain/layout-def/definitions";
import { loadedMemoryItemIdAtom } from "@/hooks/atoms/memory";
import { getDefaultDemoPreset, getRandomDemoPreset } from "@/domain/demo/presets";
import { Provider as JotaiProvider, createStore, useAtom, useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";
import { captureFeedbackScreenshot } from "@/components/feedback/capture-screenshot";
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
import { useColorAnalysis } from "@/hooks/use-color-analysis";

const FeedbackModal = dynamic(
  () =>
    import("@/components/feedback/feedback-modal").then((mod) => ({ default: mod.FeedbackModal })),
  { ssr: false },
);

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

type PlaygroundPageProps = {
  initialMemoryItemId?: string;
  initialIsAuthenticated?: boolean;
  initialOnboardingOpen?: boolean;
  initialLeftSidebarView?: LeftSidebarView;
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
    nextStore.set(activeFormatAtom, "screenshot");
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
  initialLeftSidebarView,
}: PlaygroundPageProps) {
  const router = useRouter();
  const orientation = useAtomValue(orientationAtom);
  const config = useAtomValue(configAtom);
  const personalBackgrounds = useAtomValue(personalBackgroundsAtom);
  const [previewMode, setPreviewMode] = useAtom(previewModeAtom);
  const [feedbackModalOpen, setFeedbackModalOpen] = useAtom(feedbackModalOpenAtom);
  const [feedbackScreenshot, setFeedbackScreenshot] = useState<string | null>(null);
  const [isPreparingScreenshotPreset, setIsPreparingScreenshotPreset] = useState(false);

  // Export success sheet state
  const [showExportSheet, setShowExportSheet] = useAtom(showExportSheetAtom);
  const exportThumbnail = useAtomValue(exportThumbnailAtom);
  const setExportThumbnail = useSetAtom(exportThumbnailAtom);

  const { isBrandUser } = useUserTier();

  const handlePreviewModeChange = useCallback((mode: PreviewMode) => {
    setPreviewMode(mode);
    track("preview_mode_changed", { mode });
  }, [setPreviewMode]);

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
  } = useMemory();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user) || Boolean(initialIsAuthenticated);
  const loadedItemId = useAtomValue(loadedMemoryItemIdAtom);
  const [leftSidebarView, setLeftSidebarView] = useState<LeftSidebarView>(
    initialLeftSidebarView ?? "saved",
  );
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(
    initialLeftSidebarView === "brand" || initialLeftSidebarView === "account",
  );

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
      setLeftSidebarOpen(false);
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
  const { processColorAnalysis } = useColorAnalysis();
  const layoutFormat = getLayoutFormat(config.layoutId);
  const exportDimensions = useMemo(
    () => getExportDimensionsForLayout(config, orientation),
    [config, orientation],
  );
  const exportBaseDimensions = useMemo(
    () => (
      layoutFormat === "testimonial"
        ? { width: canvas.width, height: canvas.height }
        : ORIENTATION_DIMENSIONS[orientation]
    ),
    [canvas.height, canvas.width, layoutFormat, orientation],
  );

  // Show loading when hydrating a saved design, or while preparing screenshot demo preset.
  const showLoadingState =
    (isLoggedIn && Boolean(initialMemoryItemId) && !loadedItemId) || isPreparingScreenshotPreset;

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

      // Auto-select first layout of the chosen format
      const firstLayout = LAYOUT_DEFINITIONS.find((l) => l.format === format);
      if (firstLayout) {
        const nextConfig = withLayoutTextDefaults(firstLayout.createConfig());
        setConfig(nextConfig);
        setScreenshotZoom(1.0);

        track("format_tab_switched", { from: "none", to: format });
      }
    },
    [
      processColorAnalysis,
      setActiveFormat,
      setAssets,
      setConfig,
      setScreenshotZoom,
      setIsPreparingScreenshotPreset,
    ],
  );

  const handleLeftSidebarViewChange = useCallback((view: LeftSidebarView) => {
    setLeftSidebarView(view);
    if (typeof window === "undefined") return;
    const routeForView: Record<LeftSidebarView, string> = {
      saved: "/",
      brand: "/brand",
      account: "/account",
    };
    const currentPath = window.location.pathname;
    const allowedRoutes = new Set(Object.values(routeForView));
    if (!allowedRoutes.has(currentPath)) return;
    const nextPath = routeForView[view];
    if (currentPath !== nextPath) {
      window.history.replaceState(null, "", nextPath);
    }
  }, []);

  const handleLockedTestimonialClick = useCallback(() => {
    if (isLoggedIn) {
      handleLeftSidebarViewChange("brand");
      setLeftSidebarOpen(true);
      return;
    }

    router.push("/brand");
  }, [handleLeftSidebarViewChange, isLoggedIn, router]);

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
        isTestimonialFormat={layoutFormat === "testimonial"}
        isProcessingUpload={isProcessingUpload}
        onUploadClick={openFilePicker}
        onNewClick={resetToEmptyCanvas}
        canExport={canExport}
        onExport={handleExport}
        isExporting={isExporting}
        onSave={saveDesign}
        isSaving={isSaving}
        canSave={canSave}
        isAtSaveLimit={isAtLimit}
        saveCount={saveCount}
        saveLimit={saveLimit}
        onFeedbackClick={handleFeedbackClick}
        onLeftSidebarToggle={
          isLoggedIn ? () => setLeftSidebarOpen((prev) => !prev) : undefined
        }
        leftSidebarOpen={leftSidebarOpen}
        previewMode={previewMode}
        onPreviewModeChange={handlePreviewModeChange}
        showVideoToggle={isBrandUser && hasCustomScreenshot && supportsVideo(config.layoutId)}
      />

      {/* Layout: Left Rail/Drawer | Content (Looks + Preview) | Design Sidebar */}
      <div className={cn("flex min-h-0 flex-1", isMobile ? "flex-col" : "overflow-hidden")}>
        {/* Left: Logged-in sidebar (rail + drawer) */}
        {isLoggedIn ? (
          <MemoryErrorBoundary>
            <LeftSidebar
              isOpen={leftSidebarOpen}
              activeView={leftSidebarView}
              onOpenChange={setLeftSidebarOpen}
              onViewChange={handleLeftSidebarViewChange}
              onLoadItem={loadMemoryItem}
              onDeleteItem={deleteDesign}
              isMobile={isMobile}
            />
          </MemoryErrorBoundary>
        ) : null}

        {/* Center: Content Column (Looks Rail + Preview) */}
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
                onLockedTestimonialClick={handleLockedTestimonialClick}
                canvasHeight={canvas.height}
                canvasWidth={canvas.width}
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

      {isMobile && isFormatChosen ? (
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
