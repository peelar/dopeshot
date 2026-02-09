import { describe, it, expect } from "vitest";
import {
  buildTypingSchedule,
  calculateVideoDuration,
  countVisible,
  MIN_DURATION_FRAMES,
} from "@/remotion/typing-schedule";

describe("buildTypingSchedule", () => {
  it("returns empty array for empty string", () => {
    expect(buildTypingSchedule("", 42)).toEqual([]);
  });

  it("returns one entry per character", () => {
    const schedule = buildTypingSchedule("Hello", 42);
    expect(schedule).toHaveLength(5);
  });

  it("produces non-decreasing frame numbers", () => {
    const schedule = buildTypingSchedule("The quick brown fox", 42);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]).toBeGreaterThanOrEqual(schedule[i - 1]);
    }
  });

  it("is deterministic — same seed produces same schedule", () => {
    const a = buildTypingSchedule("Hello World", 42);
    const b = buildTypingSchedule("Hello World", 42);
    expect(a).toEqual(b);
  });

  it("different seeds produce different schedules", () => {
    const a = buildTypingSchedule("Hello World", 42);
    const b = buildTypingSchedule("Hello World", 137);
    expect(a).not.toEqual(b);
  });
});

describe("countVisible", () => {
  it("returns 0 when elapsed is before first character", () => {
    const schedule = buildTypingSchedule("Hi", 42);
    expect(countVisible(schedule, 0)).toBe(0);
  });

  it("returns full length when elapsed exceeds last frame", () => {
    const schedule = buildTypingSchedule("Hi", 42);
    expect(countVisible(schedule, 9999)).toBe(2);
  });
});

describe("calculateVideoDuration", () => {
  it("returns minimum duration for short text", () => {
    const duration = calculateVideoDuration({
      title: "Hi",
      subtitle: "",
      typingEnabled: true,
    });
    expect(duration).toBe(MIN_DURATION_FRAMES);
  });

  it("returns minimum duration when typing is disabled", () => {
    const duration = calculateVideoDuration({
      title: "A".repeat(200),
      subtitle: "B".repeat(200),
      typingEnabled: false,
    });
    expect(duration).toBe(MIN_DURATION_FRAMES);
  });

  it("exceeds minimum for long text with typing enabled", () => {
    const duration = calculateVideoDuration({
      title: "This is a really long title that should take quite a while to type out",
      subtitle: "And this is an equally long subtitle with many characters",
      typingEnabled: true,
    });
    expect(duration).toBeGreaterThan(MIN_DURATION_FRAMES);
  });

  it("longer text produces longer duration", () => {
    const short = calculateVideoDuration({
      title: "Short",
      subtitle: "",
      typingEnabled: true,
    });
    const long = calculateVideoDuration({
      title: "This is a much longer title with many more characters to type",
      subtitle: "Plus a subtitle that adds even more typing time",
      typingEnabled: true,
    });
    expect(long).toBeGreaterThanOrEqual(short);
  });

  it("treats undefined typingEnabled as false (default off)", () => {
    const withFalse = calculateVideoDuration({
      title: "Hello World",
      subtitle: "Subtitle",
      typingEnabled: false,
    });
    const withUndefined = calculateVideoDuration({
      title: "Hello World",
      subtitle: "Subtitle",
    });
    expect(withUndefined).toBe(withFalse);
  });
});
