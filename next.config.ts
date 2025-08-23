import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), '@prisma/client']
    return config
  },
  // Ensure proper output for Cloudflare
  output: 'standalone',
  // Disable image optimization if not needed
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
