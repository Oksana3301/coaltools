import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = LoginSchema.parse(body)

    // Get Prisma client (returns null if not available)
    const prisma = getPrismaClient()
    
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Return user data (without password)
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'Login berhasil'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Data tidak valid', 
          details: error.issues 
        },
        { status: 400 }
      )
    }

    console.error('Error during login:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}
