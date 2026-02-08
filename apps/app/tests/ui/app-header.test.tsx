import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/layout/app-header";

vi.mock("@/components/layout/user-menu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

const defaultProps = {
  isLoggedIn: false,
  hasSelectedSavedDesign: false,
  hasCustomScreenshot: false,
  isTestimonialFormat: false,
  isProcessingUpload: false,
  onUploadClick: vi.fn(),
  onNewClick: vi.fn(),
  canExport: false,
  onExport: vi.fn(),
  isExporting: false,
  onSave: vi.fn(),
  isSaving: false,
  canSave: false,
  isAtSaveLimit: false,
  saveCount: 0,
  saveLimit: 3,
};

describe("AppHeader", () => {
  it("shows Change Screenshot CTA for logged-out users with secondary style and refresh icon", () => {
    render(<AppHeader {...defaultProps} />);

    const button = screen.getByRole("button", { name: "Change Screenshot" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-foreground");
    expect(button).toHaveClass("text-background");
    expect(button.querySelector("svg.lucide-refresh-cw")).toBeInTheDocument();
  });

  it("shows New CTA for logged-in users viewing a saved design", () => {
    render(
      <AppHeader
        {...defaultProps}
        isLoggedIn
        hasSelectedSavedDesign
        hasCustomScreenshot
      />,
    );

    const button = screen.getByRole("button", { name: "New Design" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("New");
  });
});
