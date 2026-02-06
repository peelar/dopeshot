import type { RichTextMark, RichTextSegment } from "./types";

export const RICH_TEXT_MARKS = [
  "bold",
  "italic",
  "underline",
  "highlight-1",
  "highlight-2",
  "highlight-3",
] as const;

const HIGHLIGHT_MARKS: ReadonlySet<RichTextMark> = new Set([
  "highlight-1",
  "highlight-2",
  "highlight-3",
]);

const MARK_PRIORITY: Record<RichTextMark, number> = {
  bold: 0,
  italic: 1,
  underline: 2,
  "highlight-1": 3,
  "highlight-2": 4,
  "highlight-3": 5,
};

export function isRichTextMark(value: unknown): value is RichTextMark {
  return typeof value === "string" && RICH_TEXT_MARKS.includes(value as RichTextMark);
}

function normalizeMarks(marks: RichTextMark[] | undefined): RichTextMark[] | undefined {
  if (!marks?.length) {
    return undefined;
  }

  const unique = Array.from(new Set(marks.filter(isRichTextMark))).sort(
    (a, b) => MARK_PRIORITY[a] - MARK_PRIORITY[b],
  );

  if (!unique.length) {
    return undefined;
  }

  const hasHighlight = unique.some((mark) => HIGHLIGHT_MARKS.has(mark));
  const withoutHighlights = unique.filter((mark) => !HIGHLIGHT_MARKS.has(mark));

  // Keep only one public highlight style. Legacy highlight marks normalize to highlight-1.
  return hasHighlight ? [...withoutHighlights, "highlight-1"] : withoutHighlights;
}

function marksEqual(a: RichTextMark[] | undefined, b: RichTextMark[] | undefined): boolean {
  if (!a?.length && !b?.length) {
    return true;
  }
  if (!a?.length || !b?.length || a.length !== b.length) {
    return false;
  }
  return a.every((mark, index) => mark === b[index]);
}

export function normalizeRichTextSegments(
  segments: RichTextSegment[] | undefined,
): RichTextSegment[] {
  if (!segments?.length) {
    return [];
  }

  const normalized: RichTextSegment[] = [];

  for (const segment of segments) {
    if (!segment || typeof segment.text !== "string" || segment.text.length === 0) {
      continue;
    }

    const marks = normalizeMarks(segment.marks);
    const nextSegment: RichTextSegment = marks?.length
      ? { text: segment.text, marks }
      : { text: segment.text };

    const previous = normalized[normalized.length - 1];
    if (previous && marksEqual(previous.marks, nextSegment.marks)) {
      previous.text += nextSegment.text;
      continue;
    }

    normalized.push(nextSegment);
  }

  return normalized;
}

export function segmentsToPlainText(segments: RichTextSegment[] | undefined): string {
  if (!segments?.length) {
    return "";
  }
  return segments.map((segment) => segment.text).join("");
}

export function truncateSegments(
  segments: RichTextSegment[] | undefined,
  maxLength: number,
): RichTextSegment[] {
  if (!segments?.length || maxLength < 0) {
    return [];
  }

  if (!Number.isFinite(maxLength)) {
    return normalizeRichTextSegments(segments);
  }

  let remaining = Math.floor(maxLength);
  const truncated: RichTextSegment[] = [];

  for (const segment of segments) {
    if (remaining <= 0) {
      break;
    }

    if (segment.text.length <= remaining) {
      truncated.push(segment);
      remaining -= segment.text.length;
      continue;
    }

    truncated.push({
      text: segment.text.slice(0, remaining),
      marks: segment.marks,
    });
    remaining = 0;
  }

  return normalizeRichTextSegments(truncated);
}
