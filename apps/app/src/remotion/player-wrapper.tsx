"use client";

import { useEffect, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { PeakVideo } from "@/remotion/compositions/peak-video";
import type { PeakVideoProps } from "@/remotion/types";

interface PlayerWrapperProps {
  inputProps: PeakVideoProps;
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
  const prevPropsRef = useRef<string>("");
  const isFirstMount = useRef(true);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !onPlay) return;

    player.addEventListener("play", onPlay);
    return () => {
      player.removeEventListener("play", onPlay);
    };
  }, [onPlay]);

  // Replay from start when design props change.
  // First mount is handled by autoPlay; subsequent changes seek to 0 and play.
  useEffect(() => {
    const serialized = JSON.stringify(inputProps);
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevPropsRef.current = serialized;
      return;
    }
    if (serialized !== prevPropsRef.current) {
      prevPropsRef.current = serialized;
      playerRef.current?.seekTo(0);
      playerRef.current?.play();
    }
  }, [inputProps]);

  return (
    <Player
      ref={playerRef}
      component={PeakVideo}
      inputProps={inputProps}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      autoPlay
      controls
      style={{ width: "100%" }}
    />
  );
}
