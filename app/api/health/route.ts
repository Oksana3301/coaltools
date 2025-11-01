/**
 * Health Check API Endpoint
 *
 * Provides system health status including database connectivity
 */

import { NextResponse } from 'next/server'
import {
  testDatabaseConnection,
  isDatabaseAvailable,
  getConnectionStats
} from '@/lib/db'

export async function GET() {
  try {
    const startTime = Date.now()

    // Check database availability
    const dbAvailable = isDatabaseAvailable()
    const stats = getConnectionStats()

    // Test database connection
    const dbConnected = dbAvailable ? await testDatabaseConnection(1) : false

    const responseTime = Date.now() - startTime

    const status = {
      status: dbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          available: dbAvailable,
          connected: dbConnected,
          lastHealthCheck: stats.lastHealthCheck
            ? new Date(stats.lastHealthCheck).toISOString()
            : null,
          timeSinceLastCheck: stats.timeSinceLastCheck
            ? `${Math.round(stats.timeSinceLastCheck / 1000)}s`
            : null,
          connectionAttempts: stats.connectionAttempts
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasPooledUrl: !!process.env.POSTGRES_PRISMA_URL
        }
      },
      responseTime: `${responseTime}ms`
    }

    return NextResponse.json(status, {
      status: dbConnected ? 200 : 503
    })
  } catch (error: any) {
    console.error('[Health Check] Error:', error)

    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    })
  }
}
