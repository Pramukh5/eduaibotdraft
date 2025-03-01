import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  // Disable server-side rendering for compatibility with Puter.js
  // which requires browser environment
  experimental: {
    // Any experimental features can go here
  },
  // Configure webpack to handle Puter.js as an external script
  webpack: (config) => {
    // Add Puter as an external dependency
    config.externals = [...(config.externals || []), { puter: 'puter' }];
    return config;
  },
};

export default nextConfig;
