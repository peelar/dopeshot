import { act, render, screen, waitFor } from "@testing-library/react";
import { Provider, createStore, useAtomValue } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { brandSettingsAtom, configAtom, assetsAtom, getEmptyCanvasConfig } from "@/hooks/atoms";
import { loadedMemoryItemIdAtom } from "@/hooks/atoms/memory";
import { useBrandLogoAutoApply } from "@/hooks/use-brand-logo-auto-apply";

vi.mock("@/lib/auth/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "user-1" } } }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function LogoProbe() {
  useBrandLogoAutoApply({ enabled: true });
  const config = useAtomValue(configAtom);
  const assets = useAtomValue(assetsAtom);

  return (
    <div>
      <span data-testid="logo-id">{config.assets?.logo ?? "none"}</span>
      <span data-testid="asset-count">{assets.length}</span>
    </div>
  );
}

describe("useBrandLogoAutoApply", () => {
  it("reapplies the brand logo after resetting to a new design", async () => {
    const store = createStore();
    const screenshotAsset = {
      id: "screenshot-1",
      projectId: "project-1",
      userId: "user-1",
      name: "screen.png",
      url: "https://cdn.test/screen.png",
      kind: "screenshot" as const,
      createdAt: new Date().toISOString(),
    };

    store.set(brandSettingsAtom, {
      logoUrl: "https://cdn.test/logo.png",
      logoPath: "user-1/logo.png",
      useLogoOnScreenshots: true,
    });
    store.set(configAtom, {
      ...getEmptyCanvasConfig(),
      assets: {
        ...getEmptyCanvasConfig().assets,
        screenshot: screenshotAsset.id,
      },
    });
    store.set(assetsAtom, [screenshotAsset]);
    store.set(loadedMemoryItemIdAtom, null);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          logoUrl: "https://cdn.test/logo.png",
          profile: { logoPath: "user-1/logo.png" },
        }),
      }),
    );

    render(
      <Provider store={store}>
        <LogoProbe />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("logo-id").textContent).not.toBe("none");
      expect(screen.getByTestId("asset-count").textContent).toBe("2");
    });

    act(() => {
      store.set(configAtom, getEmptyCanvasConfig());
      store.set(assetsAtom, []);
      store.set(loadedMemoryItemIdAtom, null);
    });

    act(() => {
      store.set(configAtom, {
        ...getEmptyCanvasConfig(),
        assets: {
          ...getEmptyCanvasConfig().assets,
          screenshot: screenshotAsset.id,
        },
      });
      store.set(assetsAtom, [screenshotAsset]);
    });

    await waitFor(() => {
      expect(screen.getByTestId("logo-id").textContent).not.toBe("none");
      expect(screen.getByTestId("asset-count").textContent).toBe("2");
    });
  });
});
