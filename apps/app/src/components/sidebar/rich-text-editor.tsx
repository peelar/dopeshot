"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Bold, Highlighter, Italic, Underline } from "lucide-react";
import type { RichTextMark, RichTextSegment } from "@/domain/layout/types";
import {
  isRichTextMark,
  normalizeRichTextSegments,
  segmentsToPlainText,
  truncateSegments,
} from "@/domain/layout/rich-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { track } from "@/lib/analytics";

type HighlightMark = Extract<RichTextMark, `highlight-${string}`>;

const HIGHLIGHT_MARKS = ["highlight-1"] as const satisfies readonly HighlightMark[];

const HIGHLIGHT_MARK_STYLES: Record<HighlightMark, string> = {
  "highlight-1": "ds-rich-highlight ds-rich-highlight-1",
  "highlight-2": "ds-rich-highlight ds-rich-highlight-1",
  "highlight-3": "ds-rich-highlight ds-rich-highlight-1",
};

const HIGHLIGHT_SWATCH_CLASS: Record<(typeof HIGHLIGHT_MARKS)[number], string> = {
  "highlight-1": "ds-rich-highlight-1",
};

type RichTextPayload = {
  text: string;
  segments?: RichTextSegment[];
};

interface RichTextEditorProps {
  id: string;
  value: string;
  segments?: RichTextSegment[];
  placeholder: string;
  maxLength: number;
  analyticsField: "quote" | "subtitle";
  ariaLabel: string;
  onChange: (payload: RichTextPayload) => void;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSegmentToHtml(segment: RichTextSegment): string {
  let content = escapeHtml(segment.text).replaceAll("\n", "<br>");

  if (segment.marks?.includes("bold")) {
    content = `<strong>${content}</strong>`;
  }

  if (segment.marks?.includes("italic")) {
    content = `<em>${content}</em>`;
  }

  if (segment.marks?.includes("underline")) {
    content = `<u>${content}</u>`;
  }

  const highlight = segment.marks?.find(
    (mark): mark is HighlightMark => mark.startsWith("highlight-"),
  );
  if (highlight) {
    content = `<span data-highlight="${highlight}" class="${HIGHLIGHT_MARK_STYLES[highlight]}">${content}</span>`;
  }

  return content;
}

function buildEditorHtml(segments: RichTextSegment[] | undefined): string {
  if (!segments?.length) {
    return "";
  }
  return segments.map(renderSegmentToHtml).join("");
}

function addMark(marks: RichTextMark[], mark: RichTextMark): RichTextMark[] {
  if (mark.startsWith("highlight-")) {
    const withoutHighlights = marks.filter((item) => !item.startsWith("highlight-"));
    return withoutHighlights.includes(mark) ? withoutHighlights : [...withoutHighlights, mark];
  }

  return marks.includes(mark) ? marks : [...marks, mark];
}

function parseSegmentsFromEditor(root: HTMLElement): RichTextSegment[] {
  const rawSegments: RichTextSegment[] = [];

  const pushSegment = (text: string, marks: RichTextMark[]) => {
    if (!text) {
      return;
    }

    rawSegments.push(
      marks.length
        ? { text: text.replaceAll("\u00A0", " "), marks }
        : { text: text.replaceAll("\u00A0", " ") },
    );
  };

  const walk = (node: Node, marks: RichTextMark[]) => {
    if (node.nodeType === Node.TEXT_NODE) {
      pushSegment(node.textContent ?? "", marks);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === "br") {
      pushSegment("\n", marks);
      return;
    }

    let nextMarks = marks;
    if (tag === "strong" || tag === "b") {
      nextMarks = addMark(nextMarks, "bold");
    }
    if (tag === "em" || tag === "i") {
      nextMarks = addMark(nextMarks, "italic");
    }
    if (tag === "u") {
      nextMarks = addMark(nextMarks, "underline");
    }

    const textDecoration = element.style.textDecoration || element.style.textDecorationLine;
    if (textDecoration && textDecoration.includes("underline")) {
      nextMarks = addMark(nextMarks, "underline");
    }

    const highlight = element.getAttribute("data-highlight");
    if (highlight && isRichTextMark(highlight) && highlight.startsWith("highlight-")) {
      nextMarks = addMark(nextMarks, highlight);
    }

    for (const child of element.childNodes) {
      walk(child, nextMarks);
    }
  };

  for (const child of root.childNodes) {
    walk(child, []);
  }

  return normalizeRichTextSegments(rawSegments);
}

function getSelectionMarks(root: HTMLElement): RichTextMark[] {
  const selection = window.getSelection();
  if (!selection?.rangeCount) {
    return [];
  }

  const node = selection.anchorNode;
  if (!node || !root.contains(node)) {
    return [];
  }

  const marks: RichTextMark[] = [];
  let current: Node | null = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;

  while (current && current !== root) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (tag === "strong" || tag === "b") {
        marks.push("bold");
      }
      if (tag === "em" || tag === "i") {
        marks.push("italic");
      }
      if (tag === "u") {
        marks.push("underline");
      }

      const textDecoration = element.style.textDecoration || element.style.textDecorationLine;
      if (textDecoration && textDecoration.includes("underline")) {
        marks.push("underline");
      }

      const highlight = element.getAttribute("data-highlight");
      if (highlight && isRichTextMark(highlight) && highlight.startsWith("highlight-")) {
        marks.push(highlight);
      }
    }

    current = current.parentNode;
  }

  return normalizeRichTextSegments([{ text: "x", marks }])[0]?.marks ?? [];
}

function hasEditorSelection(root: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) {
    return false;
  }

  const range = selection.getRangeAt(0);
  return root.contains(range.commonAncestorContainer);
}

function getSelectedTextLength(root: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) {
    return 0;
  }

  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) {
    return 0;
  }

  return selection.toString().length;
}

function getSelectionOffsets(root: HTMLElement): { start: number; end: number } | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) {
    return null;
  }

  const beforeRange = range.cloneRange();
  beforeRange.selectNodeContents(root);
  beforeRange.setEnd(range.startContainer, range.startOffset);

  const start = beforeRange.toString().length;
  const length = range.toString().length;
  const end = start + length;

  if (end <= start) {
    return null;
  }

  return { start, end };
}

function insertPlainText(text: string) {
  if (!text) {
    return;
  }

  if (document.queryCommandSupported?.("insertText")) {
    document.execCommand("insertText", false, text);
    return;
  }

  const selection = window.getSelection();
  if (!selection?.rangeCount) {
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function tryToggleMark(command: "bold" | "italic" | "underline") {
  document.execCommand(command);
}

function placeCaretAtEnd(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);
}

function normalizeMarks(marks: RichTextMark[] | undefined): RichTextMark[] | undefined {
  if (!marks?.length) {
    return undefined;
  }

  const unique = Array.from(new Set(marks.filter(isRichTextMark)));
  if (!unique.length) {
    return undefined;
  }

  return unique;
}

function replaceRangeMarks(
  segments: RichTextSegment[],
  start: number,
  end: number,
  mapper: (marks: RichTextMark[] | undefined) => RichTextMark[] | undefined,
): RichTextSegment[] {
  const next: RichTextSegment[] = [];
  let cursor = 0;

  for (const segment of segments) {
    const segmentStart = cursor;
    const segmentEnd = cursor + segment.text.length;

    if (segmentEnd <= start || segmentStart >= end) {
      next.push(segment);
      cursor = segmentEnd;
      continue;
    }

    const overlapStart = Math.max(segmentStart, start);
    const overlapEnd = Math.min(segmentEnd, end);

    const beforeText = segment.text.slice(0, overlapStart - segmentStart);
    const selectedText = segment.text.slice(overlapStart - segmentStart, overlapEnd - segmentStart);
    const afterText = segment.text.slice(overlapEnd - segmentStart);

    if (beforeText) {
      next.push(segment.marks ? { text: beforeText, marks: segment.marks } : { text: beforeText });
    }

    if (selectedText) {
      const mappedMarks = normalizeMarks(mapper(segment.marks));
      next.push(mappedMarks ? { text: selectedText, marks: mappedMarks } : { text: selectedText });
    }

    if (afterText) {
      next.push(segment.marks ? { text: afterText, marks: segment.marks } : { text: afterText });
    }

    cursor = segmentEnd;
  }

  return normalizeRichTextSegments(next);
}

function removeHighlightMark(marks: RichTextMark[] | undefined): RichTextMark[] | undefined {
  if (!marks?.length) {
    return undefined;
  }

  const withoutHighlight = marks.filter((mark) => !mark.startsWith("highlight-"));
  return withoutHighlight.length ? withoutHighlight : undefined;
}

function setHighlightMark(
  marks: RichTextMark[] | undefined,
  highlight: HighlightMark,
): RichTextMark[] {
  const withoutHighlight = (marks ?? []).filter((mark) => !mark.startsWith("highlight-"));
  return [...withoutHighlight, highlight];
}

function getHighlightFromMarks(
  marks: RichTextMark[] | undefined,
): HighlightMark | undefined {
  if (!marks?.length) {
    return undefined;
  }
  return marks.find((mark): mark is HighlightMark => mark.startsWith("highlight-"));
}

function selectionHasOnlyHighlight(
  segments: RichTextSegment[],
  start: number,
  end: number,
  highlight: HighlightMark,
): boolean {
  let cursor = 0;
  let hasOverlap = false;

  for (const segment of segments) {
    const segmentStart = cursor;
    const segmentEnd = cursor + segment.text.length;
    cursor = segmentEnd;

    if (segmentEnd <= start || segmentStart >= end) {
      continue;
    }

    hasOverlap = true;
    const segmentHighlight = getHighlightFromMarks(segment.marks);
    if (segmentHighlight !== highlight) {
      return false;
    }
  }

  return hasOverlap;
}

export function RichTextEditor({
  id,
  value,
  segments,
  placeholder,
  maxLength,
  analyticsField,
  ariaLabel,
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastSignatureRef = useRef<string>("");
  const [activeMarks, setActiveMarks] = useState<RichTextMark[]>([]);

  const resolvedSegments = useMemo(() => {
    const normalized = normalizeRichTextSegments(segments);
    if (normalized.length > 0) {
      return normalized;
    }
    if (!value) {
      return [];
    }
    return [{ text: value }];
  }, [segments, value]);

  const currentLength = useMemo(
    () => segmentsToPlainText(resolvedSegments).length,
    [resolvedSegments],
  );

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const parsed = parseSegmentsFromEditor(editor);
    const normalized = truncateSegments(parsed, maxLength);
    const plainText = segmentsToPlainText(normalized);
    const parsedSignature = JSON.stringify(parsed);
    const signature = JSON.stringify(normalized);

    if (signature !== parsedSignature) {
      editor.innerHTML = buildEditorHtml(normalized);
      placeCaretAtEnd(editor);
    }
    lastSignatureRef.current = signature;

    setActiveMarks(getSelectionMarks(editor));
    onChange({
      text: plainText,
      segments: normalized.length > 0 ? normalized : undefined,
    });
  }, [maxLength, onChange]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const signature = JSON.stringify(resolvedSegments);
    if (signature === lastSignatureRef.current) {
      return;
    }

    editor.innerHTML = buildEditorHtml(resolvedSegments);
    lastSignatureRef.current = signature;
  }, [resolvedSegments]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      setActiveMarks(getSelectionMarks(editor));
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleToggleBold = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.focus();
    tryToggleMark("bold");
    emitChange();
    track("rich_text_used", { field: analyticsField, mark: "bold" });
  }, [analyticsField, emitChange]);

  const handleToggleItalic = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.focus();
    tryToggleMark("italic");
    emitChange();
    track("rich_text_used", { field: analyticsField, mark: "italic" });
  }, [analyticsField, emitChange]);

  const handleToggleUnderline = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.focus();
    tryToggleMark("underline");
    emitChange();
    track("rich_text_used", { field: analyticsField, mark: "underline" });
  }, [analyticsField, emitChange]);

  const handleApplyHighlight = useCallback(
    (mark: HighlightMark) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      const selectionOffsets = getSelectionOffsets(editor);
      if (!selectionOffsets) {
        return;
      }

      const parsed = parseSegmentsFromEditor(editor);
      const shouldUnset = selectionHasOnlyHighlight(
        parsed,
        selectionOffsets.start,
        selectionOffsets.end,
        mark,
      );

      const updated = replaceRangeMarks(
        parsed,
        selectionOffsets.start,
        selectionOffsets.end,
        (marks) => (shouldUnset ? removeHighlightMark(marks) : setHighlightMark(marks, mark)),
      );
      const normalized = truncateSegments(updated, maxLength);

      editor.innerHTML = buildEditorHtml(normalized);
      placeCaretAtEnd(editor);
      lastSignatureRef.current = JSON.stringify(normalized);
      setActiveMarks(getSelectionMarks(editor));
      onChange({
        text: segmentsToPlainText(normalized),
        segments: normalized.length ? normalized : undefined,
      });

      track("rich_text_used", { field: analyticsField, mark });
    },
    [analyticsField, maxLength, onChange],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        handleToggleBold();
        track("rich_text_shortcut_used", { field: analyticsField, mark: "bold" });
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
        event.preventDefault();
        handleToggleItalic();
        track("rich_text_shortcut_used", { field: analyticsField, mark: "italic" });
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "u") {
        event.preventDefault();
        handleToggleUnderline();
        track("rich_text_shortcut_used", { field: analyticsField, mark: "underline" });
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        document.execCommand("insertLineBreak");
        emitChange();
        return;
      }

      if (
        event.key.length === 1 &&
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !hasEditorSelection(editor) &&
        currentLength >= maxLength
      ) {
        event.preventDefault();
      }
    },
    [
      analyticsField,
      currentLength,
      emitChange,
      handleToggleBold,
      handleToggleItalic,
      handleToggleUnderline,
      maxLength,
    ],
  );

  const handleToolbarMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    // Keep text selection active when clicking toolbar controls.
    event.preventDefault();
  }, []);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();

      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      const rawText = event.clipboardData.getData("text/plain");
      const selectedLength = getSelectedTextLength(editor);
      const remaining = Math.max(0, maxLength - (currentLength - selectedLength));
      const pasted = rawText.slice(0, remaining);

      insertPlainText(pasted);
      emitChange();
    },
    [currentLength, emitChange, maxLength],
  );

  const activeHighlight = activeMarks.find(
    (mark): mark is HighlightMark => mark.startsWith("highlight-"),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-muted/10 p-1">
        <Button
          type="button"
          variant={activeMarks.includes("bold") ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={handleToggleBold}
          onMouseDown={handleToolbarMouseDown}
          aria-label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={activeMarks.includes("italic") ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={handleToggleItalic}
          onMouseDown={handleToolbarMouseDown}
          aria-label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={activeMarks.includes("underline") ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={handleToggleUnderline}
          onMouseDown={handleToolbarMouseDown}
          aria-label="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-border/60" aria-hidden />

        {HIGHLIGHT_MARKS.map((mark) => (
          <Button
            key={mark}
            type="button"
            variant={activeHighlight === mark ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => handleApplyHighlight(mark)}
            onMouseDown={handleToolbarMouseDown}
            aria-label="Highlight"
            className="relative"
          >
            <Highlighter className="h-3.5 w-3.5" />
            <span
              className={cn(
                "pointer-events-none absolute bottom-1 left-1 right-1 h-[2px] rounded-full",
                HIGHLIGHT_SWATCH_CLASS[mark],
              )}
              aria-hidden
            />
          </Button>
        ))}

        <span className="ml-auto pr-1 text-[10px] text-muted-foreground">
          {currentLength}/{maxLength}
        </span>
      </div>

      <div
        id={id}
        ref={editorRef}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="ds-rich-editor min-h-[84px] w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onInput={emitChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  );
}
