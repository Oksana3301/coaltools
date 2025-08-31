import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  console.log('🧪 Testing database connection...')
  
  try {
    const prisma = getPrismaClient()
    
    if (!prisma) {
      console.error('❌ Prisma client is null - DATABASE_URL missing')
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

    // Test basic query
    console.log('🔍 Testing basic database query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query successful:', result)

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
    console.error('🔥 Database connection test failed:', error)
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
