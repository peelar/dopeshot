import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { LayoutSection } from "@/components/sidebar/layout-section";
import { configAtom } from "@/hooks/atoms";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

function createScreenshotConfig() {
  const definition = getLayoutDefinition("popup-gradient-right");
  return definition!.createConfig();
}

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <LayoutSection />
    </Provider>,
  );
}

describe("LayoutSection rich subtitle editor", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.set(configAtom, createScreenshotConfig());
  });

  afterEach(() => {
    cleanup();
  });

  it("updates subtitle plain text and segments", () => {
    renderWithStore(store);

    const subtitleEditor = screen.getByRole("textbox", { name: "Subtitle" });
    subtitleEditor.innerHTML = `Ship <em>faster</em> with <span data-highlight="highlight-2">better visuals</span>`;
    fireEvent.input(subtitleEditor);

    const config = store.get(configAtom);
    expect(config.text.subtitle).toBe("Ship faster with better visuals");
    expect(config.layoutSpecificSettings?.richText?.subtitle).toEqual([
      { text: "Ship " },
      { text: "faster", marks: ["italic"] },
      { text: " with " },
      { text: "better visuals", marks: ["highlight-1"] },
    ]);
  });
});
