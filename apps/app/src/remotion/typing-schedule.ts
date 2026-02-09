/**
 * Shared typing schedule logic used by the PeakVideo composition
 * (for rendering) and by the preview/export (for calculating duration).
 */

/** Frame at which the title typing begins */
export const TITLE_START = 15;
/** Frame gap between title finish and subtitle start */
export const SUBTITLE_GAP = 5;
/** Minimum frame for subtitle start (even if title finishes earlier) */
export const MIN_SUBTITLE_START = 35;
/** Number of frames the cursor blinks after all typing is done */
export const CURSOR_BLINK_FRAMES = 24;

const TAIL_BUFFER = 15;
const MIN_DURATION_FRAMES = 150; // 5 seconds at 30fps
const VIDEO_FPS = 30;

/**
 * Builds a typing schedule with natural rhythm — each entry is the
 * cumulative frame at which that character should appear.
 * Uses a seeded PRNG (Mulberry32) for deterministic randomness across renders.
 */
export function buildTypingSchedule(text: string, seed: number): number[] {
  if (!text) return [];

  let s = seed;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const schedule: number[] = [];
  let elapsed = 0;

  for (let i = 0; i < text.length; i++) {
    // Wide range: fast bursts (0.4f) to hesitant pauses (2.8f)
    let delay = 0.4 + rand() * 2.4;

    // ~12% chance of a longer "thinking" pause (3–6 extra frames)
    if (rand() < 0.12) {
      delay += 3 + rand() * 3;
    }

    elapsed += delay;
    schedule.push(Math.round(elapsed));
  }

  return schedule;
}

/**
 * Returns the number of characters visible at a given elapsed frame.
 */
export function countVisible(schedule: number[], elapsed: number): number {
  let count = 0;
  for (const f of schedule) {
    if (elapsed >= f) count++;
    else break;
  }
  return count;
}

/**
 * Calculates the total video duration in frames based on the text content
 * and whether typing animation is enabled.
 *
 * When typing is enabled, the video is long enough for the full typewriter
 * animation + cursor blink + a short buffer. Always at least 5 seconds.
 *
 * When typing is disabled (fade+slide), 5 seconds is sufficient.
 */
export function calculateVideoDuration(props: {
  title: string;
  subtitle: string;
  typingEnabled?: boolean;
}): number {
  // When typing is not enabled, the fade+slide animation
  // completes within 70 frames so the minimum 150 is plenty.
  if (!props.typingEnabled) return MIN_DURATION_FRAMES;

  const titleSchedule = buildTypingSchedule(props.title, 42);
  const titleEnd = TITLE_START + (titleSchedule[titleSchedule.length - 1] ?? 0);

  const subtitleSchedule = buildTypingSchedule(props.subtitle, 137);
  const subtitleStart = Math.max(MIN_SUBTITLE_START, titleEnd + SUBTITLE_GAP);
  const subtitleEnd = subtitleStart + (subtitleSchedule[subtitleSchedule.length - 1] ?? 0);

  const lastEnd = props.subtitle ? subtitleEnd : titleEnd;
  const needed = lastEnd + CURSOR_BLINK_FRAMES + TAIL_BUFFER;

  return Math.max(MIN_DURATION_FRAMES, needed);
}

export { VIDEO_FPS, MIN_DURATION_FRAMES };
