import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { TestimonialAuthorSection, TestimonialContentSection } from "@/components/sidebar/testimonial-author-section";
import { configAtom } from "@/hooks/atoms";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

function createTestimonialConfig() {
  const def = getLayoutDefinition("testimonial");
  return def!.createConfig();
}

function renderAuthorWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <TestimonialAuthorSection />
    </Provider>,
  );
}

function renderContentWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <TestimonialContentSection />
    </Provider>,
  );
}

describe("TestimonialAuthorSection", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.set(configAtom, createTestimonialConfig());
  });

  afterEach(() => {
    cleanup();
  });

  it("renders all input fields", () => {
    renderAuthorWithStore(store);

    expect(screen.getByPlaceholderText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("CEO")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Acme Inc.")).toBeInTheDocument();
  });

  it("updates author name on input", () => {
    renderAuthorWithStore(store);

    const nameInput = screen.getByPlaceholderText("Jane Smith");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.authorName).toBe("Jane Doe");
  });

  it("updates author title on input", () => {
    renderAuthorWithStore(store);

    const titleInput = screen.getByPlaceholderText("CEO");
    fireEvent.change(titleInput, { target: { value: "CTO" } });

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.authorTitle).toBe("CTO");
  });

  it("updates author company on input", () => {
    renderAuthorWithStore(store);

    const companyInput = screen.getByPlaceholderText("Acme Inc.");
    fireEvent.change(companyInput, { target: { value: "Globex Corp" } });

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.authorCompany).toBe("Globex Corp");
  });

});

describe("TestimonialContentSection", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.set(configAtom, createTestimonialConfig());
  });

  afterEach(() => {
    cleanup();
  });

  it("renders 5 star buttons", () => {
    renderContentWithStore(store);

    const starButtons = screen.getAllByRole("button", { name: /Set rating to \d star/ });
    expect(starButtons).toHaveLength(5);
  });

  it("clicking a star updates the rating", () => {
    renderContentWithStore(store);

    // Default is 5 stars - click 3rd star to set to 3
    const star3 = screen.getByRole("button", { name: "Set rating to 3 stars" });
    fireEvent.click(star3);

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.starRating).toBe(3);
  });

  it("clicking the same star again sets rating to 0", () => {
    // Start with rating 3
    const testimonialConfig = createTestimonialConfig();
    testimonialConfig.layoutSpecificSettings!.testimonial!.starRating = 3;
    store.set(configAtom, testimonialConfig);

    renderContentWithStore(store);

    // Click 3rd star again to toggle off
    const star3 = screen.getByRole("button", { name: "Set rating to 3 stars" });
    fireEvent.click(star3);

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.starRating).toBe(0);
  });

  it("renders quote rich text editor", () => {
    renderContentWithStore(store);

    expect(screen.getByRole("textbox", { name: "Quote" })).toBeInTheDocument();
  });

  it("updates quote text and rich segments on input", () => {
    renderContentWithStore(store);

    const quoteInput = screen.getByRole("textbox", { name: "Quote" });
    quoteInput.innerHTML = "Amazing <strong>product</strong>!";
    fireEvent.input(quoteInput);

    const config = store.get(configAtom);
    expect(config.text.title).toBe("Amazing product!");
    expect(config.layoutSpecificSettings?.richText?.title).toEqual([
      { text: "Amazing " },
      { text: "product", marks: ["bold"] },
      { text: "!" },
    ]);
  });
});
