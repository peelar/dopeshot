import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InAppHint } from "@/components/hints/in-app-hint";

describe("InAppHint", () => {
  it("does not auto-open hint content when defaultOpen is false", () => {
    render(
      <InAppHint hintText="Your brand settings live here" fallbackText="Brand" defaultOpen={false}>
        <button type="button">Brand</button>
      </InAppHint>,
    );

    expect(screen.queryByText("Your brand settings live here")).not.toBeInTheDocument();
  });
});
