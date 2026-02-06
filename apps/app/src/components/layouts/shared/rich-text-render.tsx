import { Fragment, type ReactNode } from "react";
import type { RichTextMark, RichTextSegment } from "@/domain/layout/types";
import { normalizeRichTextSegments } from "@/domain/layout/rich-text";
import { cn } from "@/lib/utils/cn";

const HIGHLIGHT_CLASS_BY_MARK: Record<Extract<RichTextMark, `highlight-${string}`>, string> = {
  "highlight-1": "ds-rich-highlight ds-rich-highlight-1",
  "highlight-2": "ds-rich-highlight ds-rich-highlight-1",
  "highlight-3": "ds-rich-highlight ds-rich-highlight-1",
};

function getHighlightMark(marks: RichTextMark[] | undefined): Extract<RichTextMark, `highlight-${string}`> | undefined {
  if (!marks?.length) {
    return undefined;
  }
  return marks.find((mark): mark is Extract<RichTextMark, `highlight-${string}`> => mark.startsWith("highlight-"));
}

function renderSegment(segment: RichTextSegment, index: number): ReactNode {
  let content: ReactNode = segment.text;

  if (segment.marks?.includes("bold")) {
    content = (
      <strong key={`bold-${index}`} className="ds-rich-bold">
        {content}
      </strong>
    );
  }

  if (segment.marks?.includes("italic")) {
    content = <em key={`italic-${index}`}>{content}</em>;
  }

  if (segment.marks?.includes("underline")) {
    content = <u key={`underline-${index}`}>{content}</u>;
  }

  const highlight = getHighlightMark(segment.marks);
  if (highlight) {
    content = (
      <span key={`highlight-${index}`} className={cn(HIGHLIGHT_CLASS_BY_MARK[highlight])}>
        {content}
      </span>
    );
  }

  return <Fragment key={`seg-${index}`}>{content}</Fragment>;
}

export function renderRichTextSegments(
  segments: RichTextSegment[] | undefined,
  fallbackText: string | undefined,
): ReactNode {
  const normalized = normalizeRichTextSegments(segments);

  if (!normalized.length) {
    return fallbackText;
  }

  return normalized.map((segment, index) => renderSegment(segment, index));
}
