import { memo, useEffect, useMemo, useRef } from "react";
import { useAtomValue } from "jotai";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";
import { LogoBadge } from "@/components/layouts/shared/LogoBadge";
import { LayoutSurface, useLayoutPrimitives } from "@/components/layouts/shared/layout-primitives";
import { GrainOverlay } from "@/components/layouts/shared/GrainOverlay";
import { ScanlinesOverlay } from "@/components/layouts/shared/ScanlinesOverlay";
import { orientationAtom, brandSettingsAtom } from "@/hooks/atoms";
import { resolveTestimonialStyle } from "@/domain/layout/testimonial-style";
import { formatTweetDate, formatMetric } from "@/domain/layout/twitter-utils";
import type { BrandMode } from "@/lib/types/brand";
import { track } from "@/lib/analytics";

interface TwitterTestimonialProps {
  className?: string;
  onUploadAsset?: (file: File, kind: "screenshot" | "logo" | "background" | "avatar") => void;
  isStatic?: boolean;
}

function XLogo({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-label="X">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TwitterTestimonialComponent({ className, onUploadAsset, isStatic = false }: TwitterTestimonialProps) {
  const orientation = useAtomValue(orientationAtom);
  const brandSettings = useAtomValue(brandSettingsAtom);
  const { resolvedTheme } = useTheme();
  const trackedBrandStyleRef = useRef<string | null>(null);
  const {
    assets,
    assetMap,
    backgroundStyle,
    config,
    logo,
    text,
  } = useLayoutPrimitives();

  const isMobile = orientation === "mobile";
  const fallbackMode: BrandMode = resolvedTheme === "dark" ? "dark" : "light";

  const twitterSettings = config.layoutSpecificSettings?.twitterTestimonial;
  const cachedTweet = twitterSettings?.cachedTweet;
  const fetchStatus = twitterSettings?.fetchStatus ?? "idle";
  const styleAccentOverride = twitterSettings?.styleAccent;
  const styleModeOverride = twitterSettings?.styleMode;

  const testimonialStyle = useMemo(
    () =>
      resolveTestimonialStyle({
        personality: brandSettings.personality,
        mode: styleModeOverride ?? brandSettings.mode,
        accent: styleAccentOverride ?? brandSettings.accent,
        fallbackMode,
        fallbackBackground: backgroundStyle,
      }),
    [
      backgroundStyle,
      brandSettings.mode,
      brandSettings.personality,
      fallbackMode,
      styleAccentOverride,
      styleModeOverride,
      brandSettings.accent,
    ],
  );

  useEffect(() => {
    if (isStatic) return;

    if (testimonialStyle.tier !== "brand") {
      trackedBrandStyleRef.current = null;
      return;
    }

    const signature = `${testimonialStyle.personality}:${testimonialStyle.mode}`;
    if (trackedBrandStyleRef.current === signature) return;

    trackedBrandStyleRef.current = signature;
    track("testimonial_brand_style_applied", {
      personality: testimonialStyle.personality,
      mode: testimonialStyle.mode,
      layout: "twitter",
    });
  }, [isStatic, testimonialStyle.mode, testimonialStyle.personality, testimonialStyle.tier]);

  const renderLogo = () => {
    if (logo) {
      return (
        <img
          src={logo.url}
          alt="Logo"
          className="h-8 w-auto max-w-[200px] object-contain"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }
    if (!onUploadAsset || isStatic) return null;
    return (
      <LogoBadge
        logo={logo}
        label="Drop your logo here"
        replaceLabel="Replace logo"
        onUploadLogo={(file) => onUploadAsset(file, "logo")}
      />
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center gap-3 py-8">
      <XLogo size={32} color={testimonialStyle.mutedTextColor} />
      <p
        className="text-sm opacity-60"
        style={{ color: testimonialStyle.mutedTextColor, fontFamily: text.fontFamily }}
      >
        Paste a tweet URL to get started
      </p>
    </div>
  );

  const renderLoadingState = () => (
    <div className="flex flex-col items-center gap-4 py-8">
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        style={{ color: testimonialStyle.mutedTextColor }}
      />
      <p
        className="text-sm opacity-60"
        style={{ color: testimonialStyle.mutedTextColor, fontFamily: text.fontFamily }}
      >
        Loading tweet...
      </p>
    </div>
  );

  const renderTweetContent = () => {
    if (!cachedTweet) return null;

    return (
      <div className="flex w-full flex-col">
        {/* Header: avatar + name/handle + X logo */}
        <div className="flex items-start gap-3">
          {cachedTweet.authorAvatarUrl && (
            <img
              src={cachedTweet.authorAvatarUrl.replace("_normal", "_200x200")}
              alt={cachedTweet.authorName}
              className="shrink-0 rounded-full object-cover"
              style={{
                width: isMobile ? 52 : 62,
                height: isMobile ? 52 : 62,
              }}
              crossOrigin="anonymous"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              className="truncate font-bold leading-tight"
              style={{
                fontFamily: text.fontFamily,
                color: testimonialStyle.textColor,
                fontSize: isMobile ? 18 : 20,
              }}
            >
              {cachedTweet.authorName}
            </span>
            <span
              className="truncate leading-tight"
              style={{
                fontFamily: text.fontFamily,
                color: testimonialStyle.mutedTextColor,
                fontSize: isMobile ? 17 : 18,
              }}
            >
              @{cachedTweet.authorHandle}
            </span>
          </div>
          <div className="shrink-0">
            <XLogo size={isMobile ? 24 : 26} color={testimonialStyle.textColor} />
          </div>
        </div>

        {/* Tweet body */}
        <p
          className={cn("mt-3 whitespace-pre-line", isMobile ? "text-[20px]" : "text-[22px]")}
          style={{
            color: testimonialStyle.textColor,
            fontFamily: text.fontFamily,
            lineHeight: 1.45,
          }}
        >
          {cachedTweet.text}
        </p>

        {/* Date + metrics footer */}
        <div
          className="mt-3 flex items-center gap-1 text-[17px]"
          style={{ color: testimonialStyle.mutedTextColor, fontFamily: text.fontFamily }}
        >
          {cachedTweet.createdAt && (
            <span>{formatTweetDate(cachedTweet.createdAt)}</span>
          )}
          {cachedTweet.metrics && (cachedTweet.metrics.likes > 0 || cachedTweet.metrics.replies > 0) && (
            <>
              {cachedTweet.metrics.replies > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong style={{ color: testimonialStyle.textColor }}>
                      {formatMetric(cachedTweet.metrics.replies)}
                    </strong>{" "}
                    Replies
                  </span>
                </>
              )}
              {cachedTweet.metrics.likes > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong style={{ color: testimonialStyle.textColor }}>
                      {formatMetric(cachedTweet.metrics.likes)}
                    </strong>{" "}
                    Likes
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const hasContent = fetchStatus === "success" && cachedTweet;

  return (
    <LayoutSurface
      className={cn("bg-cover bg-center bg-no-repeat", className)}
      backgroundStyle={testimonialStyle.canvasBackground}
      assets={assets}
      config={config}
      assetMap={assetMap}
      disablePatternOverlay
      highlightAccent={testimonialStyle.accent}
    >
      {testimonialStyle.texture === "grain" ? (
        <GrainOverlay enabled intensity={testimonialStyle.textureIntensity} />
      ) : null}
      {testimonialStyle.texture === "scanlines" ? (
        <ScanlinesOverlay enabled intensity={testimonialStyle.textureIntensity} />
      ) : null}

      <div className="relative flex h-full w-full flex-col" data-export-element data-element="container">
        {/* Logo */}
        <div className="absolute left-1/2 top-8 z-10 flex -translate-x-1/2 items-center">
          {renderLogo()}
        </div>

        {testimonialStyle.showDecorativeBlobs ? (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-[14%] -top-[30%] z-[2] h-[52%] w-[42%] rounded-full blur-3xl"
              style={{ background: testimonialStyle.blobPrimary }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[28%] -right-[14%] z-[2] h-[48%] w-[40%] rounded-full blur-3xl"
              style={{ background: testimonialStyle.blobSecondary }}
            />
          </>
        ) : null}

        {/* Centered card */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 py-16">
          <div
            className={cn(
              "relative flex w-full max-w-xl flex-col overflow-hidden border backdrop-blur-[2px]",
              isMobile ? "px-5 py-5" : "px-7 py-6",
            )}
            style={{
              background: testimonialStyle.cardBackground,
              borderColor: testimonialStyle.cardBorder,
              borderRadius: testimonialStyle.cardRadius,
              boxShadow: testimonialStyle.cardShadow,
            }}
          >
            {fetchStatus === "loading" && renderLoadingState()}
            {hasContent && renderTweetContent()}
            {!hasContent && fetchStatus !== "loading" && renderEmptyState()}
          </div>
        </div>
      </div>
    </LayoutSurface>
  );
}

export const TwitterTestimonial = memo(TwitterTestimonialComponent);
