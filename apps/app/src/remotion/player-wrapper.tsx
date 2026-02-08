"use client";

import { useEffect, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { ScreenshotIntro } from "@/remotion/compositions/screenshot-intro";
import type { ScreenshotIntroProps } from "@/remotion/types";

interface PlayerWrapperProps {
  inputProps: ScreenshotIntroProps;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  onPlay?: () => void;
}

export default function PlayerWrapper({
  inputProps,
  durationInFrames,
  fps,
  compositionWidth,
  compositionHeight,
  onPlay,
}: PlayerWrapperProps) {
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !onPlay) return;

    player.addEventListener("play", onPlay);
    return () => {
      player.removeEventListener("play", onPlay);
    };
  }, [onPlay]);

  return (
    <Player
      ref={playerRef}
      component={ScreenshotIntro}
      inputProps={inputProps}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      loop
      autoPlay
      controls
      style={{ width: "100%" }}
    />
  );
}
