import path from "node:path";
import { fileURLToPath } from "node:url";

const configPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "tailwind.config.ts",
);

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      config: configPath,
    },
    autoprefixer: {},
  },
};

export default config;
