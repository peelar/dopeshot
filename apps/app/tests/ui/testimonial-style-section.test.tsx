import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { TestimonialStyleSection } from "@/components/sidebar/testimonial-style-section";
import { configAtom, brandSettingsAtom } from "@/hooks/atoms";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

function createTestimonialConfig() {
  const def = getLayoutDefinition("testimonial");
  return def!.createConfig();
}

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <TestimonialStyleSection />
    </Provider>,
  );
}

describe("TestimonialStyleSection", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.set(configAtom, createTestimonialConfig());
  });

  afterEach(() => {
    cleanup();
  });

  it("seeds controls from brand tokens when no testimonial override exists", () => {
    store.set(brandSettingsAtom, {
      logoUrl: null,
      logoPath: null,
      useLogoOnScreenshots: false,
      accent: "#22c55e",
      mode: "dark",
      personality: "founder",
    });

    renderWithStore(store);

    const textInput = screen.getByLabelText("Background color") as HTMLInputElement;
    expect(textInput.value).toBe("#22C55E");
    expect(screen.getByLabelText("Background color uses brand settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Preferred mode uses brand settings")).toBeInTheDocument();
  });

  it("updates testimonial style accent", () => {
    renderWithStore(store);

    const textInput = screen.getByLabelText("Background color");
    fireEvent.change(textInput, { target: { value: "#123ABC" } });

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.styleAccent).toBe("#123ABC");
  });

  it("updates testimonial style mode", () => {
    renderWithStore(store);

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.styleMode).toBe("dark");
  });

  it("hides brand badges when testimonial overrides are set", () => {
    store.set(brandSettingsAtom, {
      logoUrl: null,
      logoPath: null,
      useLogoOnScreenshots: false,
      accent: "#22c55e",
      mode: "dark",
      personality: "founder",
    });

    const config = createTestimonialConfig();
    store.set(configAtom, {
      ...config,
      layoutSpecificSettings: {
        ...config.layoutSpecificSettings,
        testimonial: {
          ...config.layoutSpecificSettings?.testimonial,
          styleAccent: "#123ABC",
          styleMode: "light",
        },
      },
    });

    renderWithStore(store);

    expect(screen.queryByLabelText("Background color uses brand settings")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Preferred mode uses brand settings")).not.toBeInTheDocument();
  });
});
