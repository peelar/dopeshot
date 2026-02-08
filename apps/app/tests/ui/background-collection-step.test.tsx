import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BackgroundCollectionStep } from "@/components/onboarding/background-collection-step";

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

describe("BackgroundCollectionStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return empty items for both matched and explore
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders matched and explore sections", async () => {
    render(
      <BackgroundCollectionStep
        personality="founder"
        onDone={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Matches your personality")).toBeTruthy();
      expect(screen.getByText("More backgrounds")).toBeTruthy();
    });
  });

  it("renders Skip and Done buttons", async () => {
    render(
      <BackgroundCollectionStep
        personality="founder"
        onDone={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Skip/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Done/i })).toBeTruthy();
    });
  });

  it("calls onSkip when Skip is clicked", async () => {
    const onSkip = vi.fn();

    render(
      <BackgroundCollectionStep
        personality="founder"
        onDone={vi.fn()}
        onSkip={onSkip}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Skip/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Skip/i }));

    expect(onSkip).toHaveBeenCalledWith(0);
  });

  it("calls onDone when Done is clicked", async () => {
    const onDone = vi.fn();

    render(
      <BackgroundCollectionStep
        personality="founder"
        onDone={onDone}
        onSkip={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Done/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Done/i }));

    expect(onDone).toHaveBeenCalledWith(0);
  });

  it("shows personality description in matched section", async () => {
    render(
      <BackgroundCollectionStep
        personality="founder"
        onDone={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Curated for your Founder style")).toBeTruthy();
    });
  });

  it("has two Shuffle buttons", async () => {
    render(
      <BackgroundCollectionStep
        personality="founder"
        onDone={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    await waitFor(() => {
      const shuffleButtons = screen.getAllByRole("button", { name: /Shuffle/i });
      expect(shuffleButtons.length).toBe(2);
    });
  });
});
