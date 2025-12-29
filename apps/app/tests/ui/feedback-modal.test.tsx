import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FeedbackModal } from "@/components/feedback/feedback-modal";

// Mock analytics
vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("FeedbackModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    screenshotDataUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    // Clean up any Radix UI portals that might be left in document.body
    document.body.innerHTML = '';
  });

  it("renders when open is true", () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByText("Share Your Feedback")).toBeInTheDocument();
    expect(
      screen.getByText("Help us improve dopeshot for you")
    ).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<FeedbackModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Share Your Feedback")).not.toBeInTheDocument();
  });

  it("displays the feedback textarea with correct label", () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(
      screen.getByLabelText(
        /What are you trying to do, and what would make dopeshot better for you/i
      )
    ).toBeInTheDocument();
  });

  it("displays the optional email input", () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it("shows screenshot preview when screenshotDataUrl is provided", () => {
    const screenshotDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    render(
      <FeedbackModal {...defaultProps} screenshotDataUrl={screenshotDataUrl} />
    );
    expect(screen.getByText("Screenshot")).toBeInTheDocument();
    const img = screen.getByAltText("Canvas screenshot");
    expect(img).toHaveAttribute("src", screenshotDataUrl);
  });

  it("allows removing screenshot", async () => {
    const screenshotDataUrl = "data:image/png;base64,test";
    render(
      <FeedbackModal {...defaultProps} screenshotDataUrl={screenshotDataUrl} />
    );

    const removeButton = screen.getByRole("button", { name: /Remove screenshot/i });
    fireEvent.click(removeButton);

    // Screenshot should be hidden after removal
    await waitFor(() => {
      expect(screen.queryByAltText("Canvas screenshot")).not.toBeInTheDocument();
    });
  });

  it("disables submit button when feedback is empty", () => {
    render(<FeedbackModal {...defaultProps} />);
    const submitButton = screen.getByRole("button", { name: /Send Feedback/i });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when feedback is provided", async () => {
    render(<FeedbackModal {...defaultProps} />);

    const textarea = screen.getByLabelText(
      /What are you trying to do, and what would make dopeshot better for you/i
    );
    fireEvent.change(textarea, { target: { value: "This is my feedback" } });

    const submitButton = screen.getByRole("button", { name: /Send Feedback/i });
    expect(submitButton).not.toBeDisabled();
  });

  it("submits feedback successfully", async () => {
    const onOpenChange = vi.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<FeedbackModal {...defaultProps} onOpenChange={onOpenChange} />);

    const textarea = screen.getByLabelText(
      /What are you trying to do, and what would make dopeshot better for you/i
    );
    fireEvent.change(textarea, { target: { value: "Great app!" } });

    const submitButton = screen.getByRole("button", { name: /Send Feedback/i });
    fireEvent.click(submitButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText("Thank you for your feedback!")).toBeInTheDocument();
    });

    // Should close modal after success
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }, { timeout: 3000 });
  });

  it("handles submission errors gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });

    render(<FeedbackModal {...defaultProps} />);

    const textarea = screen.getByLabelText(
      /What are you trying to do, and what would make dopeshot better for you/i
    );
    fireEvent.change(textarea, { target: { value: "Great app!" } });

    const submitButton = screen.getByRole("button", { name: /Send Feedback/i });
    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });

  it("includes email in submission when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<FeedbackModal {...defaultProps} />);

    const textarea = screen.getByLabelText(
      /What are you trying to do, and what would make dopeshot better for you/i
    );
    fireEvent.change(textarea, { target: { value: "Great app!" } });

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /Send Feedback/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("test@example.com"),
        })
      );
    });
  });

  it("includes screenshot in submission when present", async () => {
    const screenshotDataUrl = "data:image/png;base64,test";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <FeedbackModal {...defaultProps} screenshotDataUrl={screenshotDataUrl} />
    );

    const textarea = screen.getByLabelText(
      /What are you trying to do, and what would make dopeshot better for you/i
    );
    fireEvent.change(textarea, { target: { value: "Great app!" } });

    const submitButton = screen.getByRole("button", { name: /Send Feedback/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(screenshotDataUrl),
        })
      );
    });
  });

  it("allows canceling the feedback", () => {
    const onOpenChange = vi.fn();

    render(<FeedbackModal {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets form when modal reopens", () => {
    const { rerender } = render(<FeedbackModal {...defaultProps} open={false} />);

    // Open modal
    rerender(<FeedbackModal {...defaultProps} open={true} />);

    const textarea = screen.getByLabelText(
      /What are you trying to do, and what would make dopeshot better for you/i
    );

    // Form should be empty
    expect(textarea).toHaveValue("");
  });
});
