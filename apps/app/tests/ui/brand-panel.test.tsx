import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { BrandPanel } from "@/components/brand/brand-panel";
import { brandSettingsAtom } from "@/hooks/atoms";
import { personalBackgroundsAtom } from "@/hooks/atoms/backgrounds";
import { track } from "@/lib/analytics";

vi.mock("@/hooks/use-file-upload", () => ({
  useFileUpload: () => ({ handleFileProcess: vi.fn(), isProcessingUpload: false }),
}));

vi.mock("@/hooks/use-brand-logo-auto-apply", () => ({
  useBrandLogoAutoApply: () => ({ error: null }),
}));

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

vi.mock("@/domain/backgrounds/background-service", () => ({
  uploadPersonalBackground: vi.fn(),
  deletePersonalBackground: vi.fn(),
  saveBackgroundSelection: vi.fn(),
  listCatalogBackgrounds: vi.fn().mockResolvedValue({ items: [] }),
  addCatalogBackground: vi.fn(),
}));

describe("BrandPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("saves updated brand fields locally", async () => {
    const store = createStore();
    store.set(brandSettingsAtom, {
      logoUrl: null,
      logoPath: null,
      useLogoOnScreenshots: false,
      accent: "#112233",
      mode: "light",
      personality: "hipster",
    });
    store.set(personalBackgroundsAtom, []);

    render(
      <Provider store={store}>
        <BrandPanel />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("#6366F1")).toHaveValue("#112233");
    });

    fireEvent.click(screen.getByRole("button", { name: /Save brand settings/i }));

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "brand_profile_saved",
        expect.objectContaining({ mode: "light", personality: "hipster" }),
      );
    });

    expect(store.get(brandSettingsAtom).accent).toBe("#112233");
    expect(store.get(brandSettingsAtom).personality).toBe("hipster");
  });
});
