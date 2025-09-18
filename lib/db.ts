import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only create PrismaClient if DATABASE_URL is available
const createPrismaClient = () => {
  // During build time, if DATABASE_URL is not available, return null
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. PrismaClient will not be initialized.')
    return null
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
  } catch (error) {
    console.error('Failed to create PrismaClient:', error)
    return null
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

// Handle connection errors gracefully - only if prisma client exists
if (prisma) {
  prisma.$connect()
    .then(() => {
      // Database connected successfully
    })
    .catch((error) => {
      console.error('Database connection failed:', error)
    })
}

// Helper function to ensure Prisma client is available - returns null instead of throwing
export function getPrismaClient(): PrismaClient | null {
  return prisma
}

// Export a safe version that returns null instead of throwing
export function getPrismaClientSafe(): PrismaClient | null {
  return prisma
}

// For build-time compatibility, export a mock client when DATABASE_URL is not available
export function getPrismaClientForBuild(): PrismaClient | null {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    // During production build without DATABASE_URL, return null to prevent build failures
    return null
  }
  return prisma
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  return prisma !== null
}
