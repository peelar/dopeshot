import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { ScreenshotIntroProps } from "../types";

export const ScreenshotIntro: React.FC<ScreenshotIntroProps> = ({
  screenshotUrl,
  title,
  subtitle,
  backgroundCss,
  fontFamily,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screenshot: spring-animated slide-up from below + slight scale
  const screenshotProgress = spring({
    fps,
    frame,
    config: { damping: 100, mass: 1.2 },
  });
  const screenshotTranslateY = interpolate(
    screenshotProgress,
    [0, 1],
    [400, 0]
  );
  const screenshotScale = interpolate(screenshotProgress, [0, 1], [0.95, 1]);

  // Title: fade-in + slide-up, starting at frame 10
  const titleOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleTranslateY = interpolate(frame, [10, 35], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle: same but staggered, starting at frame 25
  const subtitleOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleTranslateY = interpolate(frame, [25, 50], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: backgroundCss }}>
      {/* Text area — upper ~35% */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "35%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "0 60px",
          fontFamily,
          color: textColor,
        }}
      >
        {title ? (
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.15,
              opacity: titleOpacity,
              transform: `translateY(${titleTranslateY}px)`,
            }}
          >
            {title}
          </div>
        ) : null}
        {subtitle ? (
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              textAlign: "center",
              lineHeight: 1.4,
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleTranslateY}px)`,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* Screenshot — lower ~65%, centered with padding */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "65%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Img
          src={screenshotUrl}
          style={{
            width: "85%",
            objectFit: "contain",
            borderRadius: 12,
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.25), 0 12px 24px -8px rgba(0,0,0,0.15)",
            transform: `translateY(${screenshotTranslateY}px) scale(${screenshotScale})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
