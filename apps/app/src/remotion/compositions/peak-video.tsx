import { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { PeakVideoProps } from "../types";
import {
  buildTypingSchedule,
  countVisible,
  TITLE_START,
  SUBTITLE_GAP,
  MIN_SUBTITLE_START,
  CURSOR_BLINK_FRAMES,
} from "../typing-schedule";

// ── Grain overlay (mirrors GrainOverlay.tsx for Remotion) ────────────

function generateNoiseDataUrl(size: number, alpha: number, seed = 1): string | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const mulberry32 = (s: number) => {
    return () => {
      let t = (s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const rand = mulberry32(123456789 + size + Math.round(alpha * 1000) + seed * 31);

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const clampedAlpha = Math.max(0, Math.min(255, Math.round(255 * alpha)));

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.max(0, Math.min(255, 120 + (rand() - 0.5) * 180));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = clampedAlpha;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function GrainLayer() {
  const noise = useMemo(() => {
    const coarse = generateNoiseDataUrl(48, 0.38, 1);
    const fine = generateNoiseDataUrl(24, 0.24, 2);
    if (!coarse || !fine) return null;
    return { coarseUrl: coarse, fineUrl: fine };
  }, []);

  if (!noise) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${noise.coarseUrl}"), url("${noise.fineUrl}")`,
          backgroundSize: "48px 48px, 24px 24px",
          opacity: 0.18,
          filter: "contrast(190%) brightness(1.06)",
          imageRendering: "pixelated",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(255, 255, 255, 0.06)",
        }}
      />
    </div>
  );
}

// ── Positioning constants (mirroring PopupGradient.tsx) ──────────────

// Desktop (16:9)
const SIDE_CONTENT_TOP_DESKTOP = "30%";
const CENTER_CONTENT_TOP_DESKTOP = "15%";
const CENTER_SCREENSHOT_TOP_DESKTOP = "40%";
const CENTER_SCREENSHOT_GUTTER_DESKTOP = 0.07;
const SCREENSHOT_FRAME_WIDTH_DESKTOP = "62%";

// Mobile (9:16)
const SIDE_CONTENT_TOP_MOBILE = "20%";
const CENTER_CONTENT_TOP_MOBILE = "12%";
const CENTER_SCREENSHOT_TOP_MOBILE = "35%";
const CENTER_SCREENSHOT_GUTTER_MOBILE = 0;
const SCREENSHOT_FRAME_WIDTH_MOBILE = "85%";

const PEAK_CORNER_RADIUS = 24; // 16px at preview × 1.5 scale

// When fadeEnabled, screenshot fades in alongside the slide entrance

function getPeakBorderRadius(placement: "left" | "right" | "center", radius: number) {
  const r = `${radius}px`;
  switch (placement) {
    case "left":
      return `${r} 0 0 0`;
    case "right":
      return `0 ${r} 0 0`;
    case "center":
    default:
      return `${r} ${r} 0 0`;
  }
}

export const PeakVideo: React.FC<PeakVideoProps> = ({
  screenshotUrl,
  title,
  subtitle,
  backgroundCss,
  fontFamily,
  textColor,
  variant,
  screenshotShadowCss,
  titleStyle,
  subtitleStyle,
  grainEnabled,
  fadeEnabled,
  typingEnabled,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isMobile = height > width;

  // ── Responsive constants ────────────────────────────────────────────
  const sideContentTop = isMobile ? SIDE_CONTENT_TOP_MOBILE : SIDE_CONTENT_TOP_DESKTOP;
  const centerContentTop = isMobile ? CENTER_CONTENT_TOP_MOBILE : CENTER_CONTENT_TOP_DESKTOP;
  const centerScreenshotTop = isMobile ? CENTER_SCREENSHOT_TOP_MOBILE : CENTER_SCREENSHOT_TOP_DESKTOP;
  const centerScreenshotGutter = isMobile ? CENTER_SCREENSHOT_GUTTER_MOBILE : CENTER_SCREENSHOT_GUTTER_DESKTOP;
  const screenshotFrameWidth = isMobile ? SCREENSHOT_FRAME_WIDTH_MOBILE : SCREENSHOT_FRAME_WIDTH_DESKTOP;

  // ── Animations ──────────────────────────────────────────────────────

  // Screenshot entrance spring
  const screenshotProgress = spring({
    fps,
    frame,
    config: { damping: 120, mass: 1.5 },
  });

  // Screenshot fade-in when fadeEnabled — slightly slower than the slide
  const screenshotOpacity = fadeEnabled
    ? interpolate(frame, [0, 45], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  // ── Text animations ────────────────────────────────────────────────
  // Two modes: typing (character reveal with natural rhythm) or fade+slide

  // Typing schedules — deterministic per text content
  const titleSchedule = useMemo(() => buildTypingSchedule(title ?? "", 42), [title]);
  const subtitleSchedule = useMemo(() => buildTypingSchedule(subtitle ?? "", 137), [subtitle]);

  const titleLen = title?.length ?? 0;
  const titleTypingFrame = Math.max(0, frame - TITLE_START);
  const titleVisibleChars = countVisible(titleSchedule, titleTypingFrame);
  const titleTypingDone = titleVisibleChars >= titleLen;
  const titleTypingEndFrame = TITLE_START + (titleSchedule[titleLen - 1] ?? 0);

  const subtitleTypingStart = Math.max(MIN_SUBTITLE_START, titleTypingEndFrame + SUBTITLE_GAP);
  const subtitleLen = subtitle?.length ?? 0;
  const subtitleTypingFrame = Math.max(0, frame - subtitleTypingStart);
  const subtitleVisibleChars = countVisible(subtitleSchedule, subtitleTypingFrame);
  const subtitleTypingDone = subtitleVisibleChars >= subtitleLen;
  const subtitleTypingEndFrame = subtitleTypingStart + (subtitleSchedule[subtitleLen - 1] ?? 0);

  const allTypingDone = titleTypingDone && subtitleTypingDone;
  const lastTypingEndFrame = subtitleLen > 0 ? subtitleTypingEndFrame : titleTypingEndFrame;
  const cursorInTitle = frame >= TITLE_START && !titleTypingDone;
  const cursorInSubtitle = titleTypingDone && frame >= subtitleTypingStart && subtitleLen > 0 && !subtitleTypingDone;
  const cursorBlinking = allTypingDone && frame < lastTypingEndFrame + CURSOR_BLINK_FRAMES;
  const cursorBlinkOn = Math.floor((frame - lastTypingEndFrame) / 8) % 2 === 0;
  const titleCursorOpacity = cursorInTitle ? 1 : (cursorBlinking && subtitleLen === 0 ? (cursorBlinkOn ? 1 : 0) : 0);
  const subtitleCursorOpacity = cursorInSubtitle ? 1 : (cursorBlinking && subtitleLen > 0 ? (cursorBlinkOn ? 1 : 0) : 0);

  // Fade+slide mode (default)
  const titleOpacity = interpolate(frame, [15, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleTranslateY = interpolate(frame, [15, 50], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(frame, [35, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleTranslateY = interpolate(frame, [35, 70], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hide text on mobile for left/right variants (matches PopupGradient)
  const shouldShowText = !(isMobile && (variant === "left" || variant === "right"));

  // ── Font sizing ─────────────────────────────────────────────────────
  // Use pre-computed styles from adaptive typography when available,
  // fallback to proportional sizing based on composition dimensions
  const baseDimension = Math.min(width, height);
  const titleFontSize = titleStyle?.fontSizePx ?? Math.round(baseDimension * 0.048);
  const subtitleFontSize = subtitleStyle?.fontSizePx ?? Math.round(baseDimension * 0.026);
  const titleLineHeight = titleStyle?.lineHeight ?? 1.15;
  const subtitleLineHeight = subtitleStyle?.lineHeight ?? 1.4;
  const titleFontWeight = titleStyle?.fontWeight ?? 700;
  const subtitleFontWeight = subtitleStyle?.fontWeight ?? 400;
  const titleLetterSpacing = titleStyle?.letterSpacingEm ? `${titleStyle.letterSpacingEm}em` : undefined;
  const subtitleLetterSpacing = subtitleStyle?.letterSpacingEm ? `${subtitleStyle.letterSpacingEm}em` : undefined;

  // ── Screenshot entrance direction ───────────────────────────────────
  // variant="left"  → screenshot on RIGHT side → enters from right
  // variant="right" → screenshot on LEFT side  → enters from left
  // variant="center" → screenshot at bottom    → enters from bottom
  const getScreenshotTransform = () => {
    if (variant === "center") {
      const translateY = interpolate(screenshotProgress, [0, 1], [height, 0]);
      return `translateY(${translateY}px)`;
    }
    if (variant === "left") {
      // Screenshot is on the right, enters from right
      const translateX = interpolate(screenshotProgress, [0, 1], [width, 0]);
      return `translateX(${translateX}px)`;
    }
    // variant === "right": screenshot is on the left, enters from left
    const translateX = interpolate(screenshotProgress, [0, 1], [-width, 0]);
    return `translateX(${translateX}px)`;
  };

  const screenshotTransform = getScreenshotTransform();

  // ── Render text block ───────────────────────────────────────────────
  const renderText = (align: "left" | "right" | "center") => {
    if (!shouldShowText) return null;

    if (typingEnabled) {
      return (
        <>
          {title ? (
            <div
              style={{
                fontSize: titleFontSize,
                fontWeight: titleFontWeight,
                textAlign: align,
                lineHeight: titleLineHeight,
                letterSpacing: titleLetterSpacing,
              }}
            >
              <span>{title.slice(0, titleVisibleChars)}</span>
              <span
                style={{
                  opacity: titleCursorOpacity,
                  fontWeight: 300,
                  marginLeft: 2,
                }}
              >
                |
              </span>
            </div>
          ) : null}
          {subtitle && frame >= subtitleTypingStart ? (
            <div
              style={{
                fontSize: subtitleFontSize,
                fontWeight: subtitleFontWeight,
                textAlign: align,
                lineHeight: subtitleLineHeight,
                letterSpacing: subtitleLetterSpacing,
                marginTop: 24,
              }}
            >
              <span>{subtitle.slice(0, subtitleVisibleChars)}</span>
              <span
                style={{
                  opacity: subtitleCursorOpacity,
                  fontWeight: 300,
                  marginLeft: 2,
                }}
              >
                |
              </span>
            </div>
          ) : null}
        </>
      );
    }

    // Default: fade + slide
    return (
      <>
        {title ? (
          <div
            style={{
              fontSize: titleFontSize,
              fontWeight: titleFontWeight,
              textAlign: align,
              lineHeight: titleLineHeight,
              letterSpacing: titleLetterSpacing,
              opacity: titleOpacity,
              transform: `translateY(${titleTranslateY}px)`,
              textWrap: "balance",
            }}
          >
            {title}
          </div>
        ) : null}
        {subtitle ? (
          <div
            style={{
              fontSize: subtitleFontSize,
              fontWeight: subtitleFontWeight,
              textAlign: align,
              lineHeight: subtitleLineHeight,
              letterSpacing: subtitleLetterSpacing,
              marginTop: 24,
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleTranslateY}px)`,
              textWrap: "balance",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </>
    );
  };

  // ── Center variant ──────────────────────────────────────────────────
  if (variant === "center") {
    const gutterPercent = `${centerScreenshotGutter * 100}%`;

    return (
      <AbsoluteFill style={{ background: backgroundCss, fontFamily, color: textColor }}>
        {grainEnabled ? <GrainLayer /> : null}
        {/* Text region */}
        <div
          style={{
            position: "absolute",
            top: centerContentTop,
            left: 0,
            right: 0,
            height: `calc(${centerScreenshotTop} - ${centerContentTop} - 18px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 72px", // calc(100%-96px)/2 ≈ 48px + px-8 (32px) at preview × 1.5
            maxWidth: 1728, // max-w-6xl (1152px) × 1.5
            margin: "0 auto",
            zIndex: 10,
          }}
        >
          {renderText("center")}
        </div>

        {/* Screenshot frame */}
        <div
          style={{
            position: "absolute",
            top: centerScreenshotTop,
            bottom: 0,
            left: gutterPercent,
            right: gutterPercent,
            borderRadius: getPeakBorderRadius("center", PEAK_CORNER_RADIUS),
            overflow: "hidden",
            boxShadow: screenshotShadowCss,
            transform: screenshotTransform,
            zIndex: 10,
          }}
        >
          <Img
            src={screenshotUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              opacity: screenshotOpacity,
            }}
          />
        </div>
      </AbsoluteFill>
    );
  }

  // ── Side variants (left / right) ────────────────────────────────────
  const isLeftVariant = variant === "left";
  const textAlign = isLeftVariant ? "left" : "right";

  return (
    <AbsoluteFill style={{ background: backgroundCss, fontFamily, color: textColor }}>
      {grainEnabled ? <GrainLayer /> : null}
      {/* Text column */}
      {shouldShowText && (
        <div
          style={{
            position: "absolute",
            top: sideContentTop,
            bottom: "18%",
            ...(isLeftVariant ? { left: 84 } : { right: 84 }), // left-14 (56px) × 1.5
            width: "min(630px, 45%)", // min(420px, 45%) × 1.5
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            zIndex: 10,
          }}
        >
          {renderText(textAlign)}
        </div>
      )}

      {/* Screenshot frame */}
      <div
        style={{
          position: "absolute",
          top: sideContentTop,
          bottom: 0,
          width: screenshotFrameWidth,
          ...(isLeftVariant ? { right: 0 } : { left: 0 }),
          borderRadius: getPeakBorderRadius(variant, PEAK_CORNER_RADIUS),
          overflow: "hidden",
          boxShadow: screenshotShadowCss,
          transform: screenshotTransform,
          zIndex: 10,
        }}
      >
        <Img
          src={screenshotUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: isLeftVariant ? "0% 0%" : "100% 0%",
            opacity: screenshotOpacity,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
