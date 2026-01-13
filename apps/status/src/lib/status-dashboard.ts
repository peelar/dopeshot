export type TimeWindow = {
  start: Date;
  end: Date;
};

export type FeedbackEmail = {
  id: string;
  subject: string | null;
  created_at: string;
  to: string[];
};

export type FeedbackSummary = {
  count: number;
  latest: FeedbackEmail | null;
};

export type UserRecord = {
  id: string;
  created_at: string;
};

export function createTimeWindow(hours: number, now: Date = new Date()): TimeWindow {
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 24;
  const start = new Date(now.getTime() - safeHours * 60 * 60 * 1000);
  return { start, end: now };
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function summarizeFeedback(
  emails: FeedbackEmail[],
  options: {
    since: Date;
    recipient?: string;
    subjectPrefix?: string;
  }
): FeedbackSummary {
  const { since, recipient, subjectPrefix } = options;
  const recipientLower = recipient?.toLowerCase();

  const filtered = emails.filter((email) => {
    const createdAt = new Date(email.created_at);
    if (Number.isNaN(createdAt.getTime()) || createdAt < since) {
      return false;
    }

    if (subjectPrefix && !email.subject?.startsWith(subjectPrefix)) {
      return false;
    }

    if (recipientLower) {
      const hasRecipient = email.to.some(
        (address) => address.toLowerCase() === recipientLower
      );
      if (!hasRecipient) {
        return false;
      }
    }

    return true;
  });

  const latest = filtered
    .slice()
    .sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] ?? null;

  return {
    count: filtered.length,
    latest,
  };
}

export function countNewUsers(users: UserRecord[], since: Date): number {
  return users.filter((user) => {
    const createdAt = new Date(user.created_at);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= since;
  }).length;
}
