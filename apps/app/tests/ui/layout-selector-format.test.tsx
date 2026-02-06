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
    store = createStore();
    const def = getLayoutDefinition("popup-gradient-left");
    store.set(configAtom, def!.createConfig());
    store.set(assetsAtom, []);
    store.set(orientationAtom, "desktop");
    store.set(screenshotGradientAtom, null);
    store.set(screenshotZoomAtom, 1.0);
    store.set(activeFormatAtom, "screenshot");
  });

  it("renders Screenshot and Testimonial format tabs", () => {
    renderWithStore(store);

    expect(screen.getByText("Screenshot")).toBeInTheDocument();
    expect(screen.getByText("Testimonial")).toBeInTheDocument();
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

    const tab = screen.getByRole("button", { name: "Testimonial (sign in required)" });
    expect(tab).toBeInTheDocument();
  });

  it("shows tooltip when anonymous user clicks Testimonial tab", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Testimonial (sign in required)" });
    fireEvent.click(tab);

    expect(screen.getByText("Sign in to create testimonials")).toBeInTheDocument();
  });

  it("does not switch format when anonymous user clicks Testimonial tab", () => {
    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Testimonial (sign in required)" });
    fireEvent.click(tab);

    expect(store.get(activeFormatAtom)).toBe("screenshot");
  });

  it("switches format when logged-in user clicks Testimonial tab", () => {
    mockSessionData = { user: { id: "user-1" } };

    renderWithStore(store);

    const tab = screen.getByRole("button", { name: "Show Testimonial layouts" });
    fireEvent.click(tab);

    expect(store.get(activeFormatAtom)).toBe("testimonial");
  });

  it("shows testimonial layouts when testimonial format is active", () => {
    mockSessionData = { user: { id: "user-1" } };

    store.set(activeFormatAtom, "testimonial");
    const def = getLayoutDefinition("testimonial-centered");
    store.set(configAtom, def!.createConfig());

    renderWithStore(store);

    expect(screen.getByText("Testimonial Centered")).toBeInTheDocument();
    expect(screen.getByText("Testimonial Card")).toBeInTheDocument();
    expect(screen.getByText("Testimonial Editorial")).toBeInTheDocument();
  });
});
