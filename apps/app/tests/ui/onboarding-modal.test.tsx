import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("OnboardingModal", () => {
  it("closes after confirming dismissal", () => {
    const onOpenChange = vi.fn();

    render(
      <OnboardingModal
        open
        profile={null}
        required
        onOpenChange={onOpenChange}
        onCompleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Close onboarding"));
    fireEvent.click(screen.getByRole("button", { name: /leave anyway/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps modal open when dismissal is cancelled", () => {
    const onOpenChange = vi.fn();

    render(
      <OnboardingModal
        open
        profile={null}
        required
        onOpenChange={onOpenChange}
        onCompleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Close onboarding"));
    fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
