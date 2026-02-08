import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
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

vi.mock("@/hooks/use-user-tier", () => ({
  invalidateTierCache: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders step 1 with Next button", () => {
    render(
      <OnboardingWizard
        initialAccent="#ffffff"
        initialMode="dark"
        initialPersonality="founder"
      />,
    );

    expect(screen.getByText("Welcome to dopeshot")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Next/i })).toBeTruthy();
  });

  it("advances to step 2 on successful step 1 submit", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <OnboardingWizard
        initialAccent="#ffffff"
        initialMode="dark"
        initialPersonality="founder"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText("Build your background collection")).toBeTruthy();
    });
  });

  it("calls onDismiss on step 1 submit error", async () => {
    const onDismiss = vi.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });

    render(
      <OnboardingWizard
        initialAccent="#ffffff"
        initialMode="dark"
        initialPersonality="founder"
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });

    expect(toast.error).toHaveBeenCalledWith("Server error");
  });

  it("shows Skip and Done buttons on step 2", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    // Mock catalog background fetches (matched + explore)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(
      <OnboardingWizard
        initialAccent="#ffffff"
        initialMode="dark"
        initialPersonality="founder"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Skip/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Done/i })).toBeTruthy();
    });
  });
});
