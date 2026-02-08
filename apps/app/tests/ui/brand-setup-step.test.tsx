import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrandSetupStep } from "@/components/onboarding/brand-setup-step";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

vi.mock("@/lib/utils/toast", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("BrandSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders logo, color, and personality sections", () => {
    render(<BrandSetupStep onNext={vi.fn()} />);

    expect(screen.getByText("Start with your logo")).toBeTruthy();
    expect(screen.getByText("Choose your colors")).toBeTruthy();
    expect(screen.getByText("Pick a personality")).toBeTruthy();
  });

  it("renders the Next button", () => {
    render(<BrandSetupStep onNext={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Next/i })).toBeTruthy();
  });

  it("calls onNext with default values when clicked", () => {
    const onNext = vi.fn();
    render(
      <BrandSetupStep
        initialAccent="#FF0000"
        initialMode="dark"
        initialPersonality="founder"
        onNext={onNext}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({
        accent: "#FF0000",
        mode: "dark",
        personality: "founder",
      }),
    );
  });

  it("renders personality radio buttons", () => {
    render(<BrandSetupStep onNext={vi.fn()} />);

    const radioGroup = screen.getByRole("radiogroup");
    expect(radioGroup).toBeTruthy();

    expect(screen.getByText("Hipster")).toBeTruthy();
    expect(screen.getByText("Founder")).toBeTruthy();
    expect(screen.getByText("Hacker")).toBeTruthy();
    expect(screen.getByText("Kawaii")).toBeTruthy();
  });
});
