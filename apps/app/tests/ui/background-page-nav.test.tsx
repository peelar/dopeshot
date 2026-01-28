import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { BackgroundPageNav } from "@/components/selectors/background-page-nav";

describe("BackgroundPageNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <BackgroundPageNav activePage={0} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders correct number of dots", () => {
    render(
      <BackgroundPageNav activePage={0} totalPages={3} onPageChange={vi.fn()} />,
    );
    const dots = screen.getAllByRole("tab");
    expect(dots).toHaveLength(3);
  });

  it("marks the active dot with aria-selected", () => {
    render(
      <BackgroundPageNav activePage={1} totalPages={3} onPageChange={vi.fn()} />,
    );
    const dots = screen.getAllByRole("tab");
    expect(dots[0]).toHaveAttribute("aria-selected", "false");
    expect(dots[1]).toHaveAttribute("aria-selected", "true");
    expect(dots[2]).toHaveAttribute("aria-selected", "false");
  });

  it("disables left arrow on first page", () => {
    render(
      <BackgroundPageNav activePage={0} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables right arrow on last page", () => {
    render(
      <BackgroundPageNav activePage={2} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("enables both arrows on middle page", () => {
    render(
      <BackgroundPageNav activePage={1} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Previous page")).not.toBeDisabled();
    expect(screen.getByLabelText("Next page")).not.toBeDisabled();
  });

  it("calls onPageChange with previous page when left arrow clicked", () => {
    const onPageChange = vi.fn();
    render(
      <BackgroundPageNav activePage={2} totalPages={3} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange with next page when right arrow clicked", () => {
    const onPageChange = vi.fn();
    render(
      <BackgroundPageNav activePage={0} totalPages={3} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange with dot index when dot clicked", () => {
    const onPageChange = vi.fn();
    render(
      <BackgroundPageNav activePage={0} totalPages={3} onPageChange={onPageChange} />,
    );
    const dots = screen.getAllByRole("tab");
    fireEvent.click(dots[2]);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
