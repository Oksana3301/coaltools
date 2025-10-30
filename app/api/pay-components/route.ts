import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

// Use shared prisma client from lib/db
const prisma = getPrismaClient()

// Validation schema
const payComponentSchema = z.object({
  nama: z.string().min(1, "Nama komponen harus diisi"),
  tipe: z.enum(['EARNING', 'DEDUCTION'], {
    errorMap: () => ({ message: "Tipe harus EARNING atau DEDUCTION" })
  }),
  taxable: z.boolean().default(true),
  metode: z.enum(['FLAT', 'PER_HARI', 'PERSENTASE', 'FORMULA'], {
    errorMap: () => ({ message: "Metode harus FLAT, PER_HARI, PERSENTASE, atau FORMULA" })
  }),
  basis: z.enum(['UPAH_HARIAN', 'UPAH_BULANAN', 'UPAH_BRUTO', 'CUSTOM']).optional(),
  nominal: z.number().min(0).optional(),
  rate: z.number().min(0).max(100).optional(),
  formula: z.string().optional(),
  order: z.number().int().default(0),
  aktif: z.boolean().default(true),
  createdBy: z.string().optional()
})

// GET - Ambil semua komponen gaji
export async function GET() {
  try {
    // Check if prisma client is available
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const components = await prisma.payComponent.findMany({
      where: { aktif: true },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: components
    })
  } catch (error) {
    console.error('Error fetching pay components:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengambil data komponen gaji'
    }, { status: 500 })
  }
}

// POST - Tambah komponen gaji baru
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const validatedData = payComponentSchema.parse(body)

    const component = await prisma.payComponent.create({
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: component,
      message: 'Komponen gaji berhasil ditambahkan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating pay component:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data tidak valid',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Gagal menambahkan komponen gaji'
    }, { status: 500 })
  }
}

// PUT - Update komponen gaji
export async function PUT(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID komponen harus disertakan'
      }, { status: 400 })
    }

    const validatedData = payComponentSchema.partial().parse(updateData)

    const component = await prisma.payComponent.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: component,
      message: 'Komponen gaji berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating pay component:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data tidak valid',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Gagal mengupdate komponen gaji'
    }, { status: 500 })
  }
}

// DELETE - Hapus komponen gaji
export async function DELETE(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID komponen harus disertakan'
      }, { status: 400 })
    }

    await prisma.payComponent.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Komponen gaji berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting pay component:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal menghapus komponen gaji'
    }, { status: 500 })
  }
}
