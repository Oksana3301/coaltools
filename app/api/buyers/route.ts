import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema untuk validasi input buyer
const buyerSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  hargaPerTonDefault: z.number().optional(),
  alamat: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  npwp: z.string().optional()
})

// GET - Ambil semua buyers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const where = includeInactive ? {} : { aktif: true }

    const buyers = await prisma.buyer.findMany({
      where,
      orderBy: { nama: 'asc' }
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
