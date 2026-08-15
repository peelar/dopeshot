import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const setTheme = vi.hoisted(() => vi.fn());

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme }),
}));

describe("ThemeToggle", () => {
  afterEach(() => {
    cleanup();
    setTheme.mockClear();
  });

  it("cycles from dark to system", async () => {
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", {
      name: "Theme: Dark. Switch to Automatic",
    });
    fireEvent.click(button);

    expect(setTheme).toHaveBeenCalledWith("system");
  });
});
