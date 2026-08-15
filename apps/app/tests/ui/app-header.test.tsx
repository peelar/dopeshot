import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { AppHeader } from "@/components/layout/app-header";

vi.mock("@/components/layout/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

const defaultProps = {
  hasCustomScreenshot: false,
  isProcessingUpload: false,
  onUploadClick: vi.fn(),
  canExport: false,
  onExport: vi.fn(),
  isExporting: false,
};

describe("AppHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows Change Screenshot CTA with secondary style and refresh icon", () => {
    render(<AppHeader {...defaultProps} hasCustomScreenshot />);

    const button = screen.getByRole("button", { name: "Change Screenshot" });
    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg.lucide-refresh-cw")).toBeInTheDocument();
  });

  it("hides Change Screenshot CTA when there is no custom screenshot", () => {
    render(<AppHeader {...defaultProps} />);

    expect(screen.queryByRole("button", { name: "Change Screenshot" })).not.toBeInTheDocument();
  });

  it("renders the theme toggle and no feedback or profile controls", () => {
    render(<AppHeader {...defaultProps} />);

    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /feedback/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /account|profile|user menu/i })).not.toBeInTheDocument();
  });
});
