export interface DemoConfig {
  id: string;
  layout: "peak-left" | "peak-center" | "code" | "backdrop";
  gradient: string;
  image: string;
  title?: string;
  subtitle?: string;
  useCase: string;
}

export const DEMO_CONFIGS: DemoConfig[] = [
  {
    id: "demo-product",
    layout: "peak-left",
    gradient: "linear-gradient(135deg, oklch(0.65 0.22 41.12 / 0.1), oklch(0.705 0.213 47.604 / 0.2))",
    image: "/demos/demo-product.svg",
    title: "Ship faster",
    subtitle: "Product updates that pop",
    useCase: "Product screenshots",
  },
  {
    id: "demo-code",
    layout: "code",
    gradient: "linear-gradient(135deg, oklch(0.145 0 0), oklch(0.269 0 0))",
    image: "/demos/demo-code.svg",
    useCase: "Code snippets",
  },
  {
    id: "demo-changelog",
    layout: "peak-center",
    gradient: "linear-gradient(135deg, oklch(0.65 0.22 41.12 / 0.15), oklch(0.205 0 0))",
    image: "/demos/demo-changelog.svg",
    title: "New features",
    subtitle: "Announce with style",
    useCase: "Changelog posts",
  },
  {
    id: "demo-mobile",
    layout: "backdrop",
    gradient: "linear-gradient(135deg, oklch(0.269 0 0), oklch(0.145 0 0))",
    image: "/demos/demo-mobile.svg",
    useCase: "Mobile apps",
  },
];
