import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { SidebarFooter } from "@/components/layout/sidebar-footer";

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    render,
  }: {
    children?: ReactNode;
    render?: ReactNode;
  }) => <>{render ?? children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("SidebarFooter", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps contact links and has no feedback button", () => {
    render(<SidebarFooter />);

    expect(screen.getByRole("link", { name: "Book a call" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Follow on Twitter" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /feedback/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/feedback/i)).not.toBeInTheDocument();
  });
});
