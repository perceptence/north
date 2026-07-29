import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root. Without this, Turbopack walks up and finds an
    // unrelated lockfile in the home directory and infers the wrong root.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
