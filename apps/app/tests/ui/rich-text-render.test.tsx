import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderRichTextSegments } from "@/components/layouts/shared/rich-text-render";

describe("renderRichTextSegments", () => {
  it("renders bold, italic, underline, and gradient highlight marks", () => {
    render(
      <p data-testid="rich-text">
        {renderRichTextSegments(
          [
            { text: "Bold", marks: ["bold"] },
            { text: " " },
            { text: "Italic", marks: ["italic"] },
            { text: " " },
            { text: "Underline", marks: ["underline"] },
            { text: " " },
            { text: "Highlight", marks: ["highlight-3"] },
          ],
          "",
        )}
      </p>,
    );

    const container = screen.getByTestId("rich-text");
    expect(container.querySelector("strong")?.textContent).toBe("Bold");
    expect(container.querySelector("em")?.textContent).toBe("Italic");
    expect(container.querySelector("u")?.textContent).toBe("Underline");

    const highlight = container.querySelector(".ds-rich-highlight-1");
    expect(highlight?.textContent).toBe("Highlight");
    expect(container.querySelector(".ds-rich-base")).not.toBeInTheDocument();
    expect(container.querySelector(".ds-rich-bold")).toBeInTheDocument();
  });

  it("falls back to plain text when no segments exist", () => {
    render(<p>{renderRichTextSegments(undefined, "Fallback text")}</p>);
    expect(screen.getByText("Fallback text")).toBeInTheDocument();
  });
});
