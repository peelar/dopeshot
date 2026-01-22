import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { toast } from "@/lib/utils/toast";

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

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("closes the modal on submit errors", async () => {
    const onDismiss = vi.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });

    render(
      <OnboardingForm
        initialLogoPath="logos/test.png"
        initialAccent="#ffffff"
        initialMode="dark"
        initialPersonality="founder"
        embedded
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Finish setup/i }));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });

    expect(toast.error).toHaveBeenCalledWith("Server error");
  });
});
