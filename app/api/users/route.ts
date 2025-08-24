import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

const UserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(['admin', 'user', 'approver']).default('user')
})

// GET - Ambil semua users
export async function GET() {
  try {
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          kasBesarExpenses: true,
          kasKecilExpenses: true
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    // Handle database connection errors
    if (error instanceof Error && error.message.includes('Database connection not available')) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data users' },
      { status: 500 }
    )
  }
}

// POST - Buat user baru
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
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

    const user = await prisma.user.create({
      data: validatedData,
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
      data: user,
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

    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat user' },
      { status: 500 }
    )
  }
}
