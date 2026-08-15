import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { Provider, createStore, useAtomValue } from "jotai";
import { afterEach, describe, expect, it } from "vitest";
import { brandSettingsAtom, configAtom, assetsAtom, getEmptyCanvasConfig } from "@/hooks/atoms";
import { useBrandLogoAutoApply } from "@/hooks/use-brand-logo-auto-apply";
import { getLayoutDefinition } from "@/domain/layout-def/definitions";

afterEach(() => {
  cleanup();
});

function LogoProbe() {
  useBrandLogoAutoApply();
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
  it("applies brand logo automatically on testimonial layouts", async () => {
    const store = createStore();
    const testimonialLayout = getLayoutDefinition("testimonial");
    if (!testimonialLayout) {
      throw new Error("testimonial layout definition is required for this test");
    }
    const testimonialConfig = testimonialLayout.createConfig();

    store.set(brandSettingsAtom, {
      logoUrl: "https://cdn.test/logo.png",
      logoPath: "user-1/logo.png",
      useLogoOnScreenshots: true,
      accent: "#6366F1",
      mode: "dark",
      personality: "founder",
    });
    store.set(configAtom, testimonialConfig);
    store.set(assetsAtom, []);

    render(
      <Provider store={store}>
        <LogoProbe />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("logo-id").textContent).not.toBe("none");
      expect(screen.getByTestId("asset-count").textContent).toBe("1");
    });
  });

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
      accent: "#6366F1",
      mode: "dark",
      personality: "founder",
    });
    store.set(configAtom, {
      ...getEmptyCanvasConfig(),
      assets: {
        ...getEmptyCanvasConfig().assets,
        screenshot: screenshotAsset.id,
      },
    });
    store.set(assetsAtom, [screenshotAsset]);

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
