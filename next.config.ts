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
  // Firebase-compatible configuration
  // Use standard build for Firebase Functions
  // output: 'export', // Commented out - using Firebase Functions instead
  // Disable image optimization if not needed
  images: {
    unoptimized: true,
  },
  // Ensure proper routing for Firebase
  trailingSlash: false,
  // Disable server-side features that might not work on Firebase
  // Note: serverComponentsExternalPackages moved to serverExternalPackages
  // experimental: {
  //   serverComponentsExternalPackages: ['@prisma/client'],
  // },
};

export default nextConfig;
