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
  useCurrentFrame: () => 120, // after all typing animations complete
  useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 150, id: "test" }),
  spring: () => 0.5,
  interpolate: (_value: number, _inputRange: number[], outputRange: number[]) => {
    return outputRange[0];
  },
}));

import { PeakVideo } from "@/remotion/compositions/peak-video";
import type { PeakVideoProps } from "@/remotion/types";

const defaultProps: PeakVideoProps = {
  screenshotUrl: "data:image/png;base64,test-screenshot",
  title: "Ship faster",
  subtitle: "Beautiful screenshots in seconds",
  backgroundCss: "linear-gradient(135deg, rgb(30 41 59), rgb(15 23 42))",
  fontFamily: "var(--font-clean)",
  textColor: "rgb(248 250 252)",
  variant: "center",
  screenshotShadowCss: "0 4px 8px rgba(0,0,0,0.2)",
};

afterEach(() => {
  cleanup();
});

describe("PeakVideo composition", () => {
  it("renders the background with provided CSS", () => {
    render(<PeakVideo {...defaultProps} />);
    const fill = screen.getByTestId("absolute-fill");
    expect(fill).toHaveStyle({ background: defaultProps.backgroundCss });
  });

  it("renders the screenshot image with the provided URL", () => {
    render(<PeakVideo {...defaultProps} />);
    const imgs = screen.getAllByTestId("screenshot-img");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    expect(imgs[0]).toHaveAttribute("src", defaultProps.screenshotUrl);
  });

  it("renders the title text for center variant", () => {
    render(<PeakVideo {...defaultProps} />);
    expect(screen.getByText("Ship faster")).toBeInTheDocument();
  });

  it("renders the subtitle text for center variant", () => {
    render(<PeakVideo {...defaultProps} />);
    expect(screen.getByText("Beautiful screenshots in seconds")).toBeInTheDocument();
  });

  it("does not render title when empty", () => {
    render(<PeakVideo {...defaultProps} title="" />);
    expect(screen.queryByText("Ship faster")).not.toBeInTheDocument();
  });

  it("does not render subtitle when empty", () => {
    render(<PeakVideo {...defaultProps} subtitle="" />);
    expect(screen.queryByText("Beautiful screenshots in seconds")).not.toBeInTheDocument();
  });

  it("renders text for left variant in desktop mode", () => {
    render(<PeakVideo {...defaultProps} variant="left" />);
    expect(screen.getByText("Ship faster")).toBeInTheDocument();
  });

  it("renders text for right variant in desktop mode", () => {
    render(<PeakVideo {...defaultProps} variant="right" />);
    expect(screen.getByText("Ship faster")).toBeInTheDocument();
  });

  it("applies font family from props", () => {
    render(<PeakVideo {...defaultProps} />);
    const fill = screen.getByTestId("absolute-fill");
    expect(fill).toHaveStyle({ fontFamily: defaultProps.fontFamily });
  });

  it("applies text color from props", () => {
    render(<PeakVideo {...defaultProps} />);
    const fill = screen.getByTestId("absolute-fill");
    expect(fill).toHaveStyle({ color: defaultProps.textColor });
  });
});
