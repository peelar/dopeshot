import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/layout/app-header";

vi.mock("@/components/layout/user-menu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
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
});
