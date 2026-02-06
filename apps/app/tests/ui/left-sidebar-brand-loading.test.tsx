import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { LeftSidebar } from "@/components/layout/left-sidebar";

const mockUseAuth = vi.fn();
const mockUseUserTier = vi.fn();

vi.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/use-user-tier", () => ({
  useUserTier: () => mockUseUserTier(),
}));

vi.mock("@/components/memory/memory-panel", () => ({
  MemoryPanel: () => <div data-testid="memory-panel" />,
}));

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

describe("LeftSidebar brand loading state", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "brand@example.com", createdAt: "2026-01-01T00:00:00.000Z" },
      session: null,
      isLoading: false,
      isAuthenticated: true,
    });

    mockUseUserTier.mockReturnValue({
      isBrandUser: false,
      isLoading: false,
    });
  });

  it("shows a loading state in brand tab while tier is resolving", () => {
    mockUseUserTier.mockReturnValue({
      isBrandUser: false,
      isLoading: true,
    });

    render(
      <LeftSidebar
        isOpen
        activeView="brand"
        onOpenChange={vi.fn()}
        onViewChange={vi.fn()}
        onLoadItem={vi.fn()}
        onDeleteItem={vi.fn()}
        isMobile={false}
      />,
    );

    expect(screen.getByText("Loading brand tools...")).toBeInTheDocument();
    expect(screen.queryByText("Brand features in progress")).not.toBeInTheDocument();
    expect(screen.queryByTestId("brand-panel")).not.toBeInTheDocument();
  });
});
