import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { BackgroundSection } from "@/components/sidebar/background-section";
import { assetsAtom, configAtom } from "@/hooks/atoms";
import {
  personalBackgroundsAtom,
  backgroundSelectionAtom,
} from "@/hooks/atoms/backgrounds";
import type { PersonalBackground } from "@/domain/backgrounds/types";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

vi.mock("@/domain/backgrounds/background-service", () => ({
  saveBackgroundSelection: vi.fn().mockResolvedValue({}),
}));

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
  const store = createStore();
  store.set(personalBackgroundsAtom, backgrounds);
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

describe("BackgroundSection (paged)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders gradient picker with no pagination when no brand backgrounds", () => {
    renderWithBackgrounds([]);

    expect(screen.getByTestId("gradient-picker")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.queryByLabelText("Background pages")).not.toBeInTheDocument();
  });

  it("shows pagination when brand backgrounds exist", () => {
    renderWithBackgrounds([makeBg("1"), makeBg("2"), makeBg("3")]);

    expect(screen.getByLabelText("Background pages")).toBeInTheDocument();
    const dots = screen.getAllByRole("tab");
    expect(dots).toHaveLength(2);
  });

  it("defaults to gradients page (page 0)", () => {
    renderWithBackgrounds([makeBg("1")]);

    expect(screen.getByLabelText("Background pages")).toBeInTheDocument();
    expect(screen.getByTestId("gradient-picker")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
  });

  it("flips to brand backgrounds page on next arrow click", () => {
    renderWithBackgrounds([makeBg("1"), makeBg("2")]);

    fireEvent.click(screen.getByLabelText("Next page"));

    expect(screen.queryByTestId("gradient-picker")).not.toBeInTheDocument();
    expect(screen.getByText("Brand Backgrounds")).toBeInTheDocument();
  });

  it("renders brand background thumbnails on brand page", () => {
    renderWithBackgrounds([makeBg("a", "Alpha"), makeBg("b", "Beta")]);

    fireEvent.click(screen.getByLabelText("Next page"));

    expect(screen.getByText("Brand Backgrounds")).toBeInTheDocument();
    const allButtons = screen.getAllByRole("button");
    const bgButtons = allButtons.filter(
      (btn) => !btn.getAttribute("aria-label")?.includes("page"),
    );
    expect(bgButtons.length).toBe(2);
  });

  it("shows 3 page dots for 7 brand backgrounds", () => {
    const bgs = Array.from({ length: 7 }, (_, i) => makeBg(`${i}`));
    renderWithBackgrounds(bgs);

    const dots = screen.getAllByRole("tab");
    expect(dots).toHaveLength(3);
  });

  it("navigates back to gradients page when first dot clicked", () => {
    renderWithBackgrounds([makeBg("1")]);

    fireEvent.click(screen.getByLabelText("Next page"));
    expect(screen.queryByTestId("gradient-picker")).not.toBeInTheDocument();

    const dots = screen.getAllByRole("tab");
    fireEvent.click(dots[0]);
    expect(screen.getByTestId("gradient-picker")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
  });
});
