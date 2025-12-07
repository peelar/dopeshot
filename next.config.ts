import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
