import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'


const LogoutSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional()
})

export async function POST(request: NextRequest) {
  try {
  // Check if prisma client is available
  if (!prisma) {
  return NextResponse.json(
  { success: false, error: 'Database connection not available' },
  { status: 503 }
  )
  }

    const body = await request.json()
    const validatedData = LogoutSchema.parse(body)

    // Get Prisma client (returns null if not available)
    // prisma already initialized above

    // Log logout activity if user information is provided
    if (validatedData.userId || validatedData.email) {
      try {
        // Get client IP address
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
        
        // Get user agent
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Find user by ID or email
        let user = null
        if (validatedData.userId) {
          user = await prisma!.user.findUnique({
            where: { id: validatedData.userId }
          })
        } else if (validatedData.email) {
          user = await prisma!.user.findUnique({
            where: { email: validatedData.email }
          })
        }

        // Create logout activity record
        if (user) {
          await prisma!.loginActivity.create({
            data: {
              userId: user.id,
              email: user.email,
              ipAddress: ip,
              userAgent: userAgent,
              status: 'LOGOUT',
              createdAt: new Date()
            }
          })
        }
      } catch (dbError) {
        // Don't fail logout if activity logging fails
        console.warn('Failed to log logout activity:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data format', 
          details: error.issues 
        },
        { status: 400 }
      )
    }

    console.error('Error during logout:', error)
    // Don't fail logout for server errors - client-side logout should still work
    return NextResponse.json(
      { 
        success: true, 
        message: 'Logout successful (server error ignored)',
        warning: 'Activity logging failed'
      },
      { status: 200 }
    )
  }
}
