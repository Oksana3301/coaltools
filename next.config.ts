import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Firebase Functions configuration
  // Use standard build for Firebase Functions
  // output: 'export', // Commented out - using Firebase Functions instead
  // Disable image optimization if not needed
  images: {
    unoptimized: true,
  },
  // Ensure proper routing for Firebase
  trailingSlash: false,
  // Configure server external packages
  serverExternalPackages: ['@prisma/client'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), '@prisma/client']
    return config
  },
};

export default nextConfig;
