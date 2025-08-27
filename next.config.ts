import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Firebase Functions configuration for API routes
  // Keep server-side rendering for API routes
  output: 'standalone',
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
  // Environment variables for Supabase
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
