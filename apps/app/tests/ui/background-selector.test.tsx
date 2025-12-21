import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Provider, createStore } from "jotai";
import { userBackgroundsAtom, curatedBackgroundsAtom } from "@/hooks/atoms";
import { BackgroundSelector } from "@/components/sidebar/background-selector";

const useSessionMock = vi.fn();

vi.mock("@/lib/auth/auth-client", () => ({
  useSession: () => useSessionMock(),
}));

function renderSelector({
  userBackgrounds = [],
  curatedBackgrounds = [],
  isAuthenticated = false,
}: {
  userBackgrounds?: Array<{
    id: string;
    name: string;
    signedUrl: string | null;
    fileSize: number;
    createdAt: string;
  }>;
  curatedBackgrounds?: Array<{
    id: string;
    name: string;
    publicUrl: string;
    tags: string[];
    isActive: boolean;
    createdAt: string;
  }>;
  isAuthenticated?: boolean;
}) {
  useSessionMock.mockReturnValue({
    data: isAuthenticated
      ? {
          session: {
            userId: "user-1",
            expiresAt: new Date().toISOString(),
          },
          user: {
            id: "user-1",
            email: "test@example.com",
            createdAt: new Date(),
          },
        }
      : null,
    isPending: false,
  });

  const store = createStore();
  store.set(userBackgroundsAtom, userBackgrounds);
  store.set(curatedBackgroundsAtom, curatedBackgrounds);

  return render(
    <Provider store={store}>
      <BackgroundSelector onSelect={vi.fn()} />
    </Provider>,
  );
}

describe("Background Selector Component", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it("hides user backgrounds for anonymous users (T030)", () => {
    renderSelector({
      userBackgrounds: [
        {
          id: "1",
          name: "sunset.png",
          signedUrl: "https://example.com/sunset.png",
          fileSize: 1024000,
          createdAt: "2025-12-21T10:00:00Z",
        },
      ],
      curatedBackgrounds: [
        {
          id: "c1",
          name: "Abstract Waves",
          publicUrl: "https://example.com/curated/waves.png",
          tags: ["gradient", "blue"],
          isActive: true,
          createdAt: "2025-12-21T11:00:00Z",
        },
      ],
      isAuthenticated: false,
    });

    expect(screen.queryByTestId("user-backgrounds-section")).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-backgrounds-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("curated-backgrounds-section")).toBeInTheDocument();
  });

  it("shows curated empty state when none are available (T029)", () => {
    renderSelector({
      userBackgrounds: [],
      curatedBackgrounds: [],
      isAuthenticated: false,
    });

    expect(screen.getByTestId("curated-backgrounds-empty")).toBeInTheDocument();
  });

  it("renders user backgrounds for authenticated users", () => {
    renderSelector({
      userBackgrounds: [
        {
          id: "1",
          name: "sunset.png",
          signedUrl: "https://example.com/sunset.png",
          fileSize: 1024000,
          createdAt: "2025-12-21T10:00:00Z",
        },
      ],
      curatedBackgrounds: [
        {
          id: "c1",
          name: "Abstract Waves",
          publicUrl: "https://example.com/curated/waves.png",
          tags: ["gradient", "blue"],
          isActive: true,
          createdAt: "2025-12-21T11:00:00Z",
        },
      ],
      isAuthenticated: true,
    });

    expect(screen.getByTestId("user-backgrounds-section")).toBeInTheDocument();
    expect(screen.getByTestId("curated-backgrounds-section")).toBeInTheDocument();
  });

  it("renders large background lists without truncation (T039)", () => {
    const userBackgrounds = Array.from({ length: 55 }, (_, index) => ({
      id: `bg-${index + 1}`,
      name: `background-${index + 1}.png`,
      signedUrl: `https://example.com/background-${index + 1}.png`,
      fileSize: 1024000,
      createdAt: "2025-12-21T10:00:00Z",
    }));

    renderSelector({
      userBackgrounds,
      curatedBackgrounds: [],
      isAuthenticated: true,
    });

    const rendered = screen.getAllByTestId(/user-background-/);
    expect(rendered).toHaveLength(55);
  });
});
