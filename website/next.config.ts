import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Trailing slash for static export compatibility
  trailingSlash: true,
};

export default nextConfig;
