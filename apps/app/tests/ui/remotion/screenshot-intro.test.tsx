import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Mock remotion before importing the component
vi.mock("remotion", () => ({
  AbsoluteFill: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div data-testid="absolute-fill" style={style}>{children}</div>
  ),
  Img: ({ src, style }: { src: string; style?: React.CSSProperties }) => (
    <img data-testid="screenshot-img" src={src} style={style} alt="" />
  ),
  useCurrentFrame: () => 45, // mid-animation
  useVideoConfig: () => ({ fps: 30, width: 1080, height: 1080, durationInFrames: 90, id: "test" }),
  spring: () => 0.5,
  interpolate: (_value: number, _inputRange: number[], outputRange: number[]) => {
    return outputRange[0];
  },
}));

import { ScreenshotIntro } from "@/remotion/compositions/screenshot-intro";

const defaultProps = {
  screenshotUrl: "data:image/png;base64,test-screenshot",
  title: "Ship faster",
  subtitle: "Beautiful screenshots in seconds",
  backgroundCss: "linear-gradient(135deg, rgb(30 41 59), rgb(15 23 42))",
  fontFamily: "var(--font-clean)",
  textColor: "rgb(248 250 252)",
};

afterEach(() => {
  cleanup();
});

describe("ScreenshotIntro composition", () => {
  it("renders the background with provided CSS", () => {
    render(<ScreenshotIntro {...defaultProps} />);
    const fill = screen.getByTestId("absolute-fill");
    expect(fill).toHaveStyle({ background: defaultProps.backgroundCss });
  });

  it("renders the screenshot image with the provided URL", () => {
    render(<ScreenshotIntro {...defaultProps} />);
    const imgs = screen.getAllByTestId("screenshot-img");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    expect(imgs[0]).toHaveAttribute("src", defaultProps.screenshotUrl);
  });

  it("renders the title text", () => {
    render(<ScreenshotIntro {...defaultProps} />);
    expect(screen.getByText("Ship faster")).toBeInTheDocument();
  });

  it("renders the subtitle text", () => {
    render(<ScreenshotIntro {...defaultProps} />);
    expect(screen.getByText("Beautiful screenshots in seconds")).toBeInTheDocument();
  });

  it("does not render title when empty", () => {
    render(<ScreenshotIntro {...defaultProps} title="" />);
    expect(screen.queryByText("Ship faster")).not.toBeInTheDocument();
  });

  it("does not render subtitle when empty", () => {
    render(<ScreenshotIntro {...defaultProps} subtitle="" />);
    expect(screen.queryByText("Beautiful screenshots in seconds")).not.toBeInTheDocument();
  });

  it("applies text color from props", () => {
    render(<ScreenshotIntro {...defaultProps} />);
    const title = screen.getByText("Ship faster");
    expect(title.parentElement).toHaveStyle({ color: defaultProps.textColor });
  });

  it("applies font family from props", () => {
    render(<ScreenshotIntro {...defaultProps} />);
    const title = screen.getByText("Ship faster");
    expect(title.parentElement).toHaveStyle({ fontFamily: defaultProps.fontFamily });
  });
});
