import {
  countNewUsers,
  createTimeWindow,
  formatRelativeTime,
  summarizeFeedback,
} from "../src/lib/status-dashboard";

describe("status dashboard helpers", () => {
  it("creates a time window from hours", () => {
    const now = new Date("2026-01-13T12:00:00Z");
    const window = createTimeWindow(6, now);

    expect(window.end).toEqual(now);
    expect(window.start.toISOString()).toBe("2026-01-13T06:00:00.000Z");
  });

  it("defaults to 24 hours for invalid input", () => {
    const now = new Date("2026-01-13T12:00:00Z");
    const window = createTimeWindow(-2, now);

    expect(window.start.toISOString()).toBe("2026-01-12T12:00:00.000Z");
  });

  it("formats relative time buckets", () => {
    const now = new Date("2026-01-13T12:00:00Z");

    expect(formatRelativeTime(new Date("2026-01-13T11:59:30Z"), now)).toBe(
      "just now"
    );
    expect(formatRelativeTime(new Date("2026-01-13T11:50:00Z"), now)).toBe(
      "10m ago"
    );
    expect(formatRelativeTime(new Date("2026-01-13T09:00:00Z"), now)).toBe(
      "3h ago"
    );
    expect(formatRelativeTime(new Date("2026-01-10T12:00:00Z"), now)).toBe(
      "3d ago"
    );
  });

  it("summarizes feedback for the configured window", () => {
    const emails = [
      {
        id: "1",
        subject: "New Feedback: Loving it",
        created_at: "2026-01-13T11:00:00Z",
        to: ["feedback@dopeshot.io"],
      },
      {
        id: "2",
        subject: "New Feedback: Another",
        created_at: "2026-01-13T10:00:00Z",
        to: ["feedback@dopeshot.io"],
      },
      {
        id: "3",
        subject: "Other",
        created_at: "2026-01-13T09:00:00Z",
        to: ["feedback@dopeshot.io"],
      },
    ];

    const summary = summarizeFeedback(emails, {
      since: new Date("2026-01-13T09:30:00Z"),
      recipient: "feedback@dopeshot.io",
      subjectPrefix: "New Feedback:",
    });

    expect(summary.count).toBe(2);
    expect(summary.latest?.id).toBe("1");
  });

  it("counts new users since a timestamp", () => {
    const users = [
      { id: "1", created_at: "2026-01-13T11:00:00Z" },
      { id: "2", created_at: "2026-01-13T08:00:00Z" },
    ];

    const count = countNewUsers(users, new Date("2026-01-13T10:00:00Z"));

    expect(count).toBe(1);
  });
});
