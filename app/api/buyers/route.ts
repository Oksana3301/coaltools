import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Configure for static export
export const dynamic = 'force-static'
export const revalidate = false

// Schema untuk validasi input buyer
const buyerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional()
})

// GET - Ambil semua buyers
export async function GET(request: NextRequest) {
    // prisma already initialized above,
        { status: 503 }
      )
    }

    
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const where = includeInactive ? {} : { aktif: true }

    const buyers = await prisma.buyer.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: buyers
    })
  } catch (error) {
    console.error('Error fetching buyers:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data pembeli'
      },
      { status: 500 }
    )
  }
}

// POST - Buat buyer baru
export async function POST(request: NextRequest) {
    // prisma already initialized above,
        { status: 503 }
      )
    }

    
  try {
    const body = await request.json()
    const validatedData = buyerSchema.parse(body)

    const buyer = await prisma.buyer.create({
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: buyer,
      message: 'Pembeli berhasil dibuat'
    })
  } catch (error) {
    console.error('Error creating buyer:', error)
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
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal membuat pembeli'
      },
      { status: 500 }
    )
  }
}
