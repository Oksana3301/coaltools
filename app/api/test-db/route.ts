import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET() {
  try {
    const prisma = getPrismaClient()
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prisma client not available',
        details: 'Database connection could not be established'
      }, { status: 500 })
    }
    
    // Test database connection with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    // Test if we can access users table
    const userCount = await prisma.user.count()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      details: {
        connectionTest: result,
        userCount: userCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prisma client not available'
      }, { status: 500 })
    }
    
    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query parameter required'
      }, { status: 400 })
    }
    
    const result = await prisma.$queryRawUnsafe(query)
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Database query error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database query failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
