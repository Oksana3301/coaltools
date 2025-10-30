import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

// Use shared prisma client from lib/db
const prisma = getPrismaClient()

export async function GET(request: NextRequest) {
  try {
    // prisma already initialized at top of file

    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Prisma client not available',
        details: 'DATABASE_URL environment variable is missing',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
          DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'N/A'
        }
      }, { status: 503 })
    }

    const result = await prisma.$queryRaw`SELECT 1 as test`

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'N/A'
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'N/A'
      }
    }, { status: 500 })
  }
}
