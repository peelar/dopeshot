import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RichTextEditor } from "@/components/sidebar/rich-text-editor";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

function setSelectionByOffsets(root: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let cursor = 0;
  let startNode: Text | null = null;
  let endNode: Text | null = null;
  let startOffset = 0;
  let endOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const length = node.textContent?.length ?? 0;
    const nodeStart = cursor;
    const nodeEnd = cursor + length;

    if (!startNode && start >= nodeStart && start <= nodeEnd) {
      startNode = node;
      startOffset = start - nodeStart;
    }

    if (!endNode && end >= nodeStart && end <= nodeEnd) {
      endNode = node;
      endOffset = end - nodeStart;
      break;
    }

    cursor = nodeEnd;
  }

  if (!startNode || !endNode) {
    throw new Error("Unable to create selection for offsets");
  }

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);

  const selection = window.getSelection();
  if (!selection) {
    throw new Error("Selection API unavailable");
  }

  selection.removeAllRanges();
  selection.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
}

describe("RichTextEditor", () => {
  it("toggles highlight off when clicking the active highlight", () => {
    const onChange = vi.fn();

    render(
      <RichTextEditor
        id="rich-editor"
        value="Hello world"
        placeholder="Type..."
        maxLength={120}
        analyticsField="quote"
        ariaLabel="Quote"
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Quote" });
    const highlightButton = screen.getByRole("button", { name: "Highlight" });

    setSelectionByOffsets(editor, 0, 5);
    fireEvent.click(highlightButton);

    const highlightedPayload = onChange.mock.calls.at(-1)?.[0] as
      | { segments?: Array<{ text: string; marks?: string[] }> }
      | undefined;
    expect(highlightedPayload?.segments).toEqual([
      { text: "Hello", marks: ["highlight-1"] },
      { text: " world" },
    ]);

    setSelectionByOffsets(editor, 0, 5);
    fireEvent.click(highlightButton);

    const unhighlightedPayload = onChange.mock.calls.at(-1)?.[0] as
      | { segments?: Array<{ text: string; marks?: string[] }> }
      | undefined;
    const hasHighlight = unhighlightedPayload?.segments?.some((segment) =>
      segment.marks?.some((mark) => mark.startsWith("highlight-")),
    );
    expect(hasHighlight).toBe(false);
  });

  it("parses underline formatting into segments", () => {
    const onChange = vi.fn();

    render(
      <RichTextEditor
        id="rich-editor-underline"
        value="Ship fast"
        placeholder="Type..."
        maxLength={120}
        analyticsField="subtitle"
        ariaLabel="Subtitle"
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Subtitle" });
    editor.innerHTML = "Ship <u>fast</u>";
    fireEvent.input(editor);

    const payload = onChange.mock.calls.at(-1)?.[0] as
      | { text?: string; segments?: Array<{ text: string; marks?: string[] }> }
      | undefined;

    expect(payload?.text).toBe("Ship fast");
    expect(payload?.segments).toEqual([
      { text: "Ship " },
      { text: "fast", marks: ["underline"] },
    ]);
  });
});
