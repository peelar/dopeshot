import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { TestimonialAuthorSection } from "@/components/sidebar/testimonial-author-section";
import { configAtom } from "@/hooks/atoms";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

function createTestimonialConfig() {
  const def = getLayoutDefinition("testimonial-centered");
  return def!.createConfig();
}

function renderWithStore(
  store: ReturnType<typeof createStore>,
  onUploadAsset?: (file: File, kind: "avatar") => void,
) {
  return render(
    <Provider store={store}>
      <TestimonialAuthorSection onUploadAsset={onUploadAsset} />
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
    renderWithStore(store);

    expect(screen.getByPlaceholderText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("CEO")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Acme Inc.")).toBeInTheDocument();
    expect(screen.getByText("Rating")).toBeInTheDocument();
    expect(screen.getByText("Avatar")).toBeInTheDocument();
  });

  it("updates author name on input", () => {
    renderWithStore(store);

    const nameInput = screen.getByPlaceholderText("Jane Smith");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.authorName).toBe("Jane Doe");
  });

  it("updates author title on input", () => {
    renderWithStore(store);

    const titleInput = screen.getByPlaceholderText("CEO");
    fireEvent.change(titleInput, { target: { value: "CTO" } });

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.authorTitle).toBe("CTO");
  });

  it("updates author company on input", () => {
    renderWithStore(store);

    const companyInput = screen.getByPlaceholderText("Acme Inc.");
    fireEvent.change(companyInput, { target: { value: "Globex Corp" } });

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.authorCompany).toBe("Globex Corp");
  });

  it("renders 5 star buttons", () => {
    renderWithStore(store);

    const starButtons = screen.getAllByRole("button", { name: /Set rating to \d star/ });
    expect(starButtons).toHaveLength(5);
  });

  it("clicking a star updates the rating", () => {
    renderWithStore(store);

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

    renderWithStore(store);

    // Click 3rd star again to toggle off
    const star3 = screen.getByRole("button", { name: "Set rating to 3 stars" });
    fireEvent.click(star3);

    const config = store.get(configAtom);
    expect(config.layoutSpecificSettings?.testimonial?.starRating).toBe(0);
  });

  it("shows avatar upload button when no avatar is set", () => {
    renderWithStore(store, vi.fn());

    const uploadButton = screen.getAllByRole("button").find(
      (btn) => btn.getAttribute("aria-label") === "Upload avatar",
    );
    expect(uploadButton).toBeDefined();
  });
});
