import type { NextConfig } from "next";

// Static site: no server at run time. Deployed to GitHub Pages, which serves the app from
// /<repository-name>/, so the workflow sets NEXT_PUBLIC_BASE_PATH to that prefix.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true, // /cong-thuc/ → cong-thuc/index.html, which static hosts serve directly
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
