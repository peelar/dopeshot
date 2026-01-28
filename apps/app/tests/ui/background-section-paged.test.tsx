import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { BackgroundSection } from "@/components/sidebar/background-section";
import { assetsAtom, configAtom } from "@/hooks/atoms";
import {
  personalBackgroundsAtom,
  backgroundSelectionAtom,
} from "@/hooks/atoms/backgrounds";
import { listPersonalBackgrounds } from "@/domain/backgrounds/background-service";
import type { PersonalBackground } from "@/domain/backgrounds/types";

// --- Mocks ---

vi.mock("@/lib/auth/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "user-1" } } }),
}));

const mockIsBrandUser = vi.fn(() => true);
vi.mock("@/hooks/use-user-tier", () => ({
  useUserTier: () => ({ isBrandUser: mockIsBrandUser(), isLoading: false }),
}));

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

vi.mock("@/domain/backgrounds/background-service", () => ({
  listPersonalBackgrounds: vi.fn().mockResolvedValue({ items: [] }),
  saveBackgroundSelection: vi.fn().mockResolvedValue({}),
  clearBackgroundSelection: vi.fn().mockResolvedValue(undefined),
}));

// Mock GradientPicker to simplify BackgroundSection tests — we only care about pagination logic
vi.mock("@/components/selectors/gradient-picker", () => ({
  GradientPicker: ({ onChangeAction }: { onChangeAction: (...args: unknown[]) => void }) => (
    <div data-testid="gradient-picker">
      <button
        data-testid="select-gradient"
        onClick={() =>
          onChangeAction(
            { type: "gradient", value: "custom", customGradient: { stops: [], type: "linear" } },
            "#ffffff",
          )
        }
      >
        Select gradient
      </button>
    </div>
  ),
}));

// --- Helpers ---

function makeBg(id: string, name?: string): PersonalBackground {
  return {
    id,
    name: name ?? `bg-${id}`,
    previewUrl: `https://example.com/${id}.jpg`,
    fileSizeKb: 100,
    widthPx: 1920,
    heightPx: 1080,
    fileFormat: "jpg",
  };
}

function renderWithBackgrounds(backgrounds: PersonalBackground[] = [], { hasScreenshot = true } = {}) {
  // Configure mock to return these backgrounds from the API
  vi.mocked(listPersonalBackgrounds).mockResolvedValue({ items: backgrounds });

  const store = createStore();
  store.set(backgroundSelectionAtom, null);
  store.set(assetsAtom, []);
  if (hasScreenshot) {
    store.set(configAtom, (prev) => ({
      ...prev,
      assets: {
        ...prev.assets,
        screenshot: "screenshot-1",
      },
    }));
  }

  const result = render(
    <Provider store={store}>
      <BackgroundSection />
    </Provider>,
  );

  return { ...result, store };
}

// --- Tests ---

describe("BackgroundSection (paged)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBrandUser.mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders gradient picker with no pagination when no brand backgrounds", async () => {
    renderWithBackgrounds([]);

    await waitFor(() => {
      expect(screen.getByTestId("gradient-picker")).toBeInTheDocument();
    });
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.queryByLabelText("Background pages")).not.toBeInTheDocument();
  });

  it("shows pagination when brand backgrounds exist", async () => {
    renderWithBackgrounds([makeBg("1"), makeBg("2"), makeBg("3")]);

    await waitFor(() => {
      expect(screen.getByLabelText("Background pages")).toBeInTheDocument();
    });
    const dots = screen.getAllByRole("tab");
    expect(dots).toHaveLength(2);
  });

  it("defaults to gradients page (page 0)", async () => {
    renderWithBackgrounds([makeBg("1")]);

    await waitFor(() => {
      expect(screen.getByLabelText("Background pages")).toBeInTheDocument();
    });
    expect(screen.getByTestId("gradient-picker")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
  });

  it("flips to brand backgrounds page on next arrow click", async () => {
    renderWithBackgrounds([makeBg("1"), makeBg("2")]);

    await waitFor(() => {
      expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Next page"));

    expect(screen.queryByTestId("gradient-picker")).not.toBeInTheDocument();
    expect(screen.getByText("Brand Backgrounds")).toBeInTheDocument();
  });

  it("renders brand background thumbnails on brand page", async () => {
    renderWithBackgrounds([makeBg("a", "Alpha"), makeBg("b", "Beta")]);

    // Wait for backgrounds to load
    await waitFor(() => {
      expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Next page"));

    // Wait for brand backgrounds to render (not skeletons)
    await waitFor(() => {
      expect(screen.getByText("Brand Backgrounds")).toBeInTheDocument();
    });

    // Each brand background renders a <button> with no aria-label.
    // Pagination arrows have aria-labels "Previous page" / "Next page".
    // Dots have role="tab" so they won't appear in getAllByRole("button").
    const allButtons = screen.getAllByRole("button");
    const bgButtons = allButtons.filter(
      (btn) => !btn.getAttribute("aria-label")?.includes("page"),
    );
    // 2 brand background thumbnails
    expect(bgButtons.length).toBe(2);
  });

  it("shows 3 page dots for 7 brand backgrounds", async () => {
    const bgs = Array.from({ length: 7 }, (_, i) => makeBg(`${i}`));
    renderWithBackgrounds(bgs);

    await waitFor(() => {
      expect(screen.getByLabelText("Background pages")).toBeInTheDocument();
    });
    const dots = screen.getAllByRole("tab");
    // 1 gradient page + 2 brand pages (ceil(7/6) = 2)
    expect(dots).toHaveLength(3);
  });

  it("navigates back to gradients page when first dot clicked", async () => {
    renderWithBackgrounds([makeBg("1")]);

    await waitFor(() => {
      expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    });

    // Go to brand page
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(screen.queryByTestId("gradient-picker")).not.toBeInTheDocument();

    // Click first dot to go back
    const dots = screen.getAllByRole("tab");
    fireEvent.click(dots[0]);
    expect(screen.getByTestId("gradient-picker")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
  });

  it("does not show pagination for non-brand users", () => {
    mockIsBrandUser.mockReturnValue(false);
    renderWithBackgrounds([]);
    expect(screen.getByTestId("gradient-picker")).toBeInTheDocument();
    expect(screen.queryByLabelText("Background pages")).not.toBeInTheDocument();
  });
});
