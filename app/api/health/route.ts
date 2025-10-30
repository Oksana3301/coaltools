import { NextResponse } from 'next/server'
import { isDatabaseAvailable, getPrismaClient } from '@/lib/db'
import { logger } from '@/lib/logger'

// Use shared prisma client from lib/db
const prisma = getPrismaClient()

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const dbAvailable = isDatabaseAvailable()
    // prisma already initialized at top of file

    let dbStatus = 'unknown'
    let dbError = null
    
    if (prisma) {
      try {
        // Try a simple query to test the connection
        await prisma.$queryRaw`SELECT 1`
        dbStatus = 'connected'
      } catch (error) {
        dbStatus = 'error'
        dbError = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      dbStatus = 'not_available'
      dbError = 'DATABASE_URL not configured'
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: {
        available: dbAvailable,
        status: dbStatus,
        error: dbError,
        url_configured: !!process.env.DATABASE_URL
      },
      message: 'Health check completed'
    })
  } catch (error) {
    logger.apiError('/api/health', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
