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

// Mock auth - anonymous user by default
let mockSessionData: unknown = null;
vi.mock("@/lib/auth/auth-client", () => ({
  useSession: () => ({ data: mockSessionData, isPending: false }),
}));

// Mock tier - free by default
let mockIsBrandUser = false;
vi.mock("@/hooks/use-user-tier", () => ({
  useUserTier: () => ({ isBrandUser: mockIsBrandUser, isLoading: false }),
}));

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
    mockSessionData = null; // Anonymous by default
    mockIsBrandUser = false; // Free tier by default
    store = createStore();
    const def = getLayoutDefinition("popup-gradient-left");
    store.set(configAtom, def!.createConfig());
    store.set(assetsAtom, []);
    store.set(orientationAtom, "desktop");
    store.set(screenshotGradientAtom, null);
    store.set(screenshotZoomAtom, 1.0);
    store.set(activeFormatAtom, "screenshot");
  });

  it("renders Screenshot, Testimonial, and Logo Swap format tabs", () => {
    renderWithStore(store);

    expect(screen.getByText("Screenshot")).toBeInTheDocument();
    expect(screen.getByText("Testimonial")).toBeInTheDocument();
    expect(screen.getByText("Logo Swap")).toBeInTheDocument();
  });

  it("Screenshot tab is active by default", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Show Screenshot layouts" });
    expect(tab).toHaveAttribute("aria-pressed", "true");
  });

  it("shows screenshot layout cards in rail when Screenshot tab is active", () => {
    renderWithStore(store);

    // Should see Peak Right (the default layout)
    expect(screen.getByText("Peak Right")).toBeInTheDocument();
  });

  it("shows lock icon on Testimonial tab for anonymous users", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Testimonial (Brand tier required)" });
    expect(tab).toBeInTheDocument();
  });

  it("shows upgrade tooltip when anonymous user hovers locked Testimonial tab", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Testimonial (Brand tier required)" });
    fireEvent.mouseEnter(tab);

    // Multiple brand-gated tabs share tooltip state, so multiple instances may appear
    const tooltips = screen.getAllByText("Available on Brand plan.");
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it("does not switch format when anonymous user clicks Testimonial tab", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Testimonial (Brand tier required)" });
    fireEvent.click(tab);

    expect(store.get(activeFormatAtom)).toBe("screenshot");
  });

  it("shows lock icon on Testimonial tab for logged-in free user", () => {
    mockSessionData = { user: { id: "user-1" } };
    mockIsBrandUser = false;

    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Testimonial (Brand tier required)" });
    expect(tab).toBeInTheDocument();
  });

  it("does not switch format when free user clicks Testimonial tab", () => {
    mockSessionData = { user: { id: "user-1" } };
    mockIsBrandUser = false;

    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Testimonial (Brand tier required)" });
    fireEvent.click(tab);

    expect(store.get(activeFormatAtom)).toBe("screenshot");
  });

  it("shows upgrade tooltip when logged-in free user hovers locked Testimonial tab", () => {
    mockSessionData = { user: { id: "user-1" } };
    mockIsBrandUser = false;

    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Testimonial (Brand tier required)" });
    fireEvent.mouseEnter(tab);

    // Multiple brand-gated tabs share tooltip state, so multiple instances may appear
    const tooltips = screen.getAllByText("Available on Brand plan.");
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it("switches format when brand user clicks Testimonial tab", () => {
    mockSessionData = { user: { id: "user-1" } };
    mockIsBrandUser = true;

    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Show Testimonial layouts" });
    fireEvent.click(tab);

    expect(store.get(activeFormatAtom)).toBe("testimonial");
  });

  it("shows testimonial layout card when testimonial format is active", () => {
    mockSessionData = { user: { id: "user-1" } };
    mockIsBrandUser = true;

    store.set(activeFormatAtom, "testimonial");
    const def = getLayoutDefinition("testimonial");
    store.set(configAtom, def!.createConfig());

    renderWithStore(store);

    // There should be a layout card with aria-label "Select Testimonial look"
    const layoutCard = screen.getByRole("button", { name: "Select Testimonial look" });
    expect(layoutCard).toBeInTheDocument();
  });

  it("shows lock icon on Logo Swap tab for anonymous users", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Logo Swap (Brand tier required)" });
    expect(tab).toBeInTheDocument();
  });

  it("does not switch format when anonymous user clicks Logo Swap tab", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Logo Swap (Brand tier required)" });
    fireEvent.click(tab);

    expect(store.get(activeFormatAtom)).toBe("screenshot");
  });

  it("switches format when brand user clicks Logo Swap tab", () => {
    mockSessionData = { user: { id: "user-1" } };
    mockIsBrandUser = true;

    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Show Logo Swap layouts" });
    fireEvent.click(tab);

    expect(store.get(activeFormatAtom)).toBe("logo-swap");
  });

  it("shows logo-swap layout card when logo-swap format is active", () => {
    mockSessionData = { user: { id: "user-1" } };
    mockIsBrandUser = true;

    store.set(activeFormatAtom, "logo-swap");
    const def = getLayoutDefinition("logo-swap");
    store.set(configAtom, def!.createConfig());

    renderWithStore(store);

    const layoutCard = screen.getByRole("button", { name: "Select Logo Swap look" });
    expect(layoutCard).toBeInTheDocument();
  });
});
