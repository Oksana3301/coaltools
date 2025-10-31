import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getPrismaClient } from '@/lib/db'

// Use shared prisma client from lib/db
// Updated to use UserRole enum from Prisma schema
const prisma = getPrismaClient()

const UserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(['ADMIN', 'STAFF', 'VIEWER']).default('STAFF')
})

// GET - Ambil semua users
export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    // Use raw query to cast enum to text to avoid type mismatch
    const users = await prisma.$queryRaw<Array<{
      id: string
      name: string | null
      email: string
      role: string
      created_at: Date
    }>>`
      SELECT id, name, email, role::text as role, created_at
      FROM users
      ORDER BY created_at DESC
    `

    // Map to match expected format
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    }))

    return NextResponse.json({
      success: true,
      data: formattedUsers
    })
  } catch (error) {
    // Handle database connection errors
    if (error instanceof Error && error.message.includes('Database connection not available')) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    logger.apiError('/api/users GET', error)
    console.error('Users API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data users',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// POST - Buat user baru
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const validatedData = UserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    const newUser = await prisma.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        role: validatedData.role as any
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User berhasil dibuat'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Data tidak valid', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('Database connection not available')) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    logger.apiError('/api/users POST', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat user' },
      { status: 500 }
    )
  }
}
