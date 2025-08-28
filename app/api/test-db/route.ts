import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

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
