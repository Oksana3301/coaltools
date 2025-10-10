/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Optimize bundling for better performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Improve webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Fix for webpack module resolution issues
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Optimize chunk splitting
    if (!dev) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    
    return config
  },
  // Suppress specific warnings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

module.exports = nextConfig