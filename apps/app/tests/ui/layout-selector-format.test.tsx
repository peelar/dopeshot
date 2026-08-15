import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { LayoutSelector } from "@/components/selectors/layout-selector";
import {
  configAtom,
  assetsAtom,
  orientationAtom,
  screenshotGradientAtom,
  screenshotZoomAtom,
  activeFormatAtom,
} from "@/hooks/atoms";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <LayoutSelector />
    </Provider>,
  );
}

describe("LayoutSelector format tabs", () => {
  let store: ReturnType<typeof createStore>;

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    store = createStore();
    const def = getLayoutDefinition("popup-gradient-left");
    store.set(configAtom, def!.createConfig());
    store.set(assetsAtom, []);
    store.set(orientationAtom, "desktop");
    store.set(screenshotGradientAtom, null);
    store.set(screenshotZoomAtom, 1.0);
    store.set(activeFormatAtom, "screenshot");
  });

  it("renders Screenshot, Testimonial, and Tweet format tabs", () => {
    renderWithStore(store);

    expect(screen.getByText("Screenshot")).toBeInTheDocument();
    expect(screen.getByText("Testimonial")).toBeInTheDocument();
    expect(screen.getByText("Tweet")).toBeInTheDocument();
  });

  it("Screenshot tab is active by default", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Show Screenshot layouts" });
    expect(tab).toHaveAttribute("aria-pressed", "true");
  });

  it("shows screenshot layout cards in rail when Screenshot tab is active", () => {
    renderWithStore(store);

    expect(screen.getByText("Peak Right")).toBeInTheDocument();
  });

  it("switches format when Testimonial tab is clicked", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Show Testimonial layouts" });
    fireEvent.click(tab);

    expect(store.get(activeFormatAtom)).toBe("testimonial");
  });

  it("shows testimonial layout card when testimonial format is active", () => {
    store.set(activeFormatAtom, "testimonial");
    const def = getLayoutDefinition("testimonial");
    store.set(configAtom, def!.createConfig());

    renderWithStore(store);

    const layoutCard = screen.getByRole("button", { name: "Select Testimonial look" });
    expect(layoutCard).toBeInTheDocument();
  });
});
