import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FFmpeg WASM works best with cross-origin isolation on studio routes
  async headers() {
    return [
      {
        source: "/studio",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
