import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Provider, createStore } from "jotai";
import { BrandPanel } from "@/components/brand/brand-panel";
import { brandSettingsAtom, userBackgroundsAtom } from "@/hooks/atoms";

vi.mock("@/lib/auth/auth-client", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "user-1",
        email: "test@example.com",
        createdAt: new Date(),
      },
    },
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-file-upload", () => ({
  useFileUpload: () => ({
    handleFileProcess: vi.fn(),
    isProcessingUpload: false,
  }),
}));

vi.mock("@/hooks/use-background-upload", () => ({
  useBackgroundUpload: () => ({
    upload: vi.fn(),
    status: "idle",
    error: null,
    progress: null,
    uploadedBackground: null,
    reset: vi.fn(),
  }),
}));

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

describe("BrandPanel background upload", () => {
  it("renders the background upload section and count (T048)", () => {
    const store = createStore();
    store.set(brandSettingsAtom, {
      logoUrl: null,
      logoPath: null,
      useLogoOnScreenshots: false,
    });
    store.set(userBackgroundsAtom, [
      {
        id: "bg-1",
        userId: "user-1",
        name: "first.png",
        imagePath: "user-1/backgrounds/first.png",
        fileSize: 1024,
        createdAt: "2025-12-21T10:00:00Z",
        signedUrl: "https://example.com/first.png",
      },
      {
        id: "bg-2",
        userId: "user-1",
        name: "second.png",
        imagePath: "user-1/backgrounds/second.png",
        fileSize: 1024,
        createdAt: "2025-12-21T10:00:00Z",
        signedUrl: "https://example.com/second.png",
      },
    ]);

    render(
      <Provider store={store}>
        <BrandPanel />
      </Provider>
    );

    expect(screen.getByTestId("background-upload-section")).toBeInTheDocument();
    expect(screen.getByTestId("background-count")).toHaveTextContent("2");
    expect(screen.getByText("Upload background")).toBeInTheDocument();
  });
});
