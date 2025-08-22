import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const email = searchParams.get('email')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive'
      }
    }

    // Get login activities with user info
    const loginActivities = await prisma.loginActivity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.loginActivity.count({ where })

    return NextResponse.json({
      success: true,
      data: loginActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching login activities:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data login activity' },
      { status: 500 }
    )
  }
}
