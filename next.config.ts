import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headers for audio & PDF streaming support
  async headers() {
    return [
      {
        source: "/materials/:path*",
        headers: [
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
