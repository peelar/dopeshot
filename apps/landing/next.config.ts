import type { NextConfig } from "next";

const analyticsProxyPath = process.env.SIMPLE_ANALYTICS_PROXY_PATH ?? "/sa";
const analyticsScriptUrl =
  process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_SCRIPT_URL ??
  "https://scripts.simpleanalyticscdn.com/latest.js";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: `${analyticsProxyPath}/latest.js`,
        destination: analyticsScriptUrl,
      },
      {
        source: `${analyticsProxyPath}/:path*`,
        destination: "https://queue.simpleanalyticscdn.com/:path*",
      },
    ];
  },
};

export default nextConfig;
