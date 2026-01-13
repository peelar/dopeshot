import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider, createStore } from "jotai";
import { BrandPanel } from "@/components/brand/brand-panel";
import { brandSettingsAtom } from "@/hooks/atoms";
import { track } from "@/lib/analytics";

vi.mock("@/lib/auth/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "user-1" } } }),
}));

vi.mock("@/hooks/use-user-tier", () => ({
  useUserTier: () => ({ isBrandUser: true, isLoading: false }),
}));

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

const mockFetch = vi.fn();

globalThis.fetch = mockFetch as typeof fetch;

describe("BrandPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("saves updated brand fields from the sidebar", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            colorPalette: { accent: "#112233", mode: "light" },
            personality: "creative",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const store = createStore();
    store.set(brandSettingsAtom, {
      logoUrl: null,
      logoPath: null,
      useLogoOnScreenshots: false,
      accent: null,
      mode: null,
      personality: null,
    });

    render(
      <Provider store={store}>
        <BrandPanel />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("#6366F1")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("#6366F1")).toHaveValue("#112233");
    });

    fireEvent.click(screen.getByRole("button", { name: /Save brand settings/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(track).toHaveBeenCalledWith(
        "brand_profile_saved",
        expect.objectContaining({ mode: "light", personality: "creative" }),
      );
    });

    const [, requestInit] = mockFetch.mock.calls[1];
    const body = JSON.parse(requestInit.body as string);
    expect(body).toEqual({ accent: "#112233", mode: "light", personality: "creative" });
  });
});
