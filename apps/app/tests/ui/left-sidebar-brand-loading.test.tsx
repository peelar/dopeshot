import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { LeftSidebar } from "@/components/layout/left-sidebar";

vi.mock("@/components/brand/brand-panel", () => ({
  BrandPanel: () => <div data-testid="brand-panel">Brand panel</div>,
}));

vi.mock("@/components/hints/in-app-hint", () => ({
  InAppHint: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    render,
  }: {
    children?: ReactNode;
    render?: (props: Record<string, unknown>) => ReactNode;
  }) => <>{render ? render({}) : children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("LeftSidebar", () => {
  it("shows the brand panel when open", () => {
    render(<LeftSidebar isOpen onOpenChange={vi.fn()} isMobile={false} />);

    expect(screen.getByTestId("brand-panel")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Brand sidebar" })).toHaveClass(
      "absolute",
      "top-0",
      "left-14",
    );
  });
});
