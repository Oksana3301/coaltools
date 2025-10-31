/**
 * Robust Database Connection Manager
 *
 * Features:
 * 1. Automatic retry with exponential backoff
 * 2. Connection pooling optimized for Vercel serverless
 * 3. Health checks
 * 4. Graceful degradation
 * 5. Comprehensive error handling
 * 6. Connection timeout management
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  lastHealthCheck: number | undefined
  connectionAttempts: number
}

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 10000, // 10 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  POOL_SIZE: {
    min: 2,
    max: 10
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = Math.min(
    CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, attempt),
    CONFIG.MAX_RETRY_DELAY
  )
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000
}

/**
 * Create Prisma Client with optimal configuration for Vercel
 */
function createPrismaClient(): PrismaClient | null {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL is not set. PrismaClient will not be initialized.')
    return null
  }

  try {
    // Use pooled connection in production (Vercel), direct in development
    const databaseUrl = process.env.NODE_ENV === 'production'
      ? (process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL)
      : (process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING)

    console.log('[DB] Initializing PrismaClient...', {
      env: process.env.NODE_ENV,
      hasPooledUrl: !!process.env.POSTGRES_PRISMA_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    })

    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      // Optimize for serverless
      ...(process.env.NODE_ENV === 'production' && {
        errorFormat: 'minimal',
      })
    })

    // Add connection timeout middleware
    client.$use(async (params, next) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), CONFIG.CONNECTION_TIMEOUT)
      )

      try {
        return await Promise.race([next(params), timeout])
      } catch (error) {
        console.error('[DB] Query error:', error)
        throw error
      }
    })

    console.log('[DB] PrismaClient initialized successfully')
    return client
  } catch (error) {
    console.error('[DB] Failed to create PrismaClient:', error)
    return null
  }
}

/**
 * Initialize Prisma with singleton pattern
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

// Initialize connection attempts counter
if (!globalForPrisma.connectionAttempts) {
  globalForPrisma.connectionAttempts = 0
}

/**
 * Test database connection with retry
 */
export async function testDatabaseConnection(maxRetries = CONFIG.MAX_RETRIES): Promise<boolean> {
  if (!prisma) {
    console.error('[DB] Prisma client not available')
    return false
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DB] Connection test attempt ${attempt + 1}/${maxRetries + 1}`)

      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`

      console.log('[DB] Connection test successful')
      globalForPrisma.lastHealthCheck = Date.now()
      globalForPrisma.connectionAttempts = 0
      return true
    } catch (error) {
      console.error(`[DB] Connection test failed (attempt ${attempt + 1}):`, error)
      globalForPrisma.connectionAttempts++

      if (attempt < maxRetries) {
        const delay = getRetryDelay(attempt)
        console.log(`[DB] Retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  console.error('[DB] All connection attempts failed')
  return false
}

/**
 * Get Prisma client with health check
 */
export async function getPrismaClient(): Promise<PrismaClient | null> {
  if (!prisma) {
    console.error('[DB] Prisma client not initialized')
    return null
  }

  // Check if we need a health check
  const now = Date.now()
  const lastCheck = globalForPrisma.lastHealthCheck || 0
  const needsHealthCheck = (now - lastCheck) > CONFIG.HEALTH_CHECK_INTERVAL

  if (needsHealthCheck) {
    console.log('[DB] Performing health check...')
    const isHealthy = await testDatabaseConnection(1) // Quick check with 1 retry
    if (!isHealthy) {
      console.error('[DB] Health check failed')
      // Still return client - it may recover on actual query
    }
  }

  return prisma
}

/**
 * Execute query with automatic retry
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = CONFIG.MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries

      console.error(`[DB] Query failed (attempt ${attempt + 1}/${maxRetries + 1}):`, {
        error: error.message,
        code: error.code,
        meta: error.meta
      })

      // Check if error is retryable
      const isRetryable = isRetryableError(error)

      if (!isRetryable || isLastAttempt) {
        throw error
      }

      const delay = getRetryDelay(attempt)
      console.log(`[DB] Retrying query in ${delay}ms...`)
      await sleep(delay)
    }
  }

  throw new Error('Max retries exceeded')
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'P1001', // Can't reach database server
    'P1002', // Database server timeout
    'P1008', // Operations timed out
    'P1017', // Server has closed the connection
    'P2024', // Timed out fetching a connection from the pool
  ]

  const retryableMessages = [
    'timeout',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'connection',
    'pool'
  ]

  // Check Prisma error codes
  if (error.code && retryableCodes.includes(error.code)) {
    return true
  }

  // Check error messages
  const errorMessage = (error.message || '').toLowerCase()
  return retryableMessages.some(msg => errorMessage.includes(msg))
}

/**
 * Safe disconnect
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    try {
      await prisma.$disconnect()
      console.log('[DB] Prisma disconnected successfully')
    } catch (error) {
      console.error('[DB] Error disconnecting Prisma:', error)
    }
  }
}

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
  return prisma !== null
}

/**
 * Get connection statistics
 */
export function getConnectionStats() {
  return {
    isAvailable: isDatabaseAvailable(),
    lastHealthCheck: globalForPrisma.lastHealthCheck,
    connectionAttempts: globalForPrisma.connectionAttempts,
    timeSinceLastCheck: globalForPrisma.lastHealthCheck
      ? Date.now() - globalForPrisma.lastHealthCheck
      : null
  }
}

// Export for backward compatibility
export const getPrismaClientSafe = getPrismaClient
export const getPrismaClientForBuild = getPrismaClient

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    disconnectPrisma()
  })
}

console.log('[DB] Database module initialized', {
  environment: process.env.NODE_ENV,
  prismaAvailable: !!prisma,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasPooledUrl: !!process.env.POSTGRES_PRISMA_URL
})
