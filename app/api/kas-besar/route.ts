import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'
import { logger } from '@/lib/logger'


// Use shared prisma client from lib/db
const prisma = getPrismaClient()


// Schema validation untuk Kas Besar
const KasBesarSchema = z.object({
  hari: z.string().min(1, "Hari wajib diisi"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  bulan: z.string().min(1, "Bulan wajib diisi"),
  tipeAktivitas: z.string().min(1, "Tipe aktivitas wajib diisi"),
  barang: z.string().min(1, "Barang wajib diisi"),
  banyak: z.number().positive("Banyak harus lebih dari 0"),
  satuan: z.string().min(1, "Satuan wajib diisi"),
  hargaSatuan: z.number().positive("Harga satuan harus lebih dari 0"),
  total: z.number().positive("Total harus lebih dari 0"),
  vendorNama: z.string().min(1, "Nama vendor wajib diisi"),
  vendorTelp: z.string().optional(),
  vendorEmail: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  jenis: z.string().default("kas_besar"),
  subJenis: z.string().min(1, "Sub jenis wajib diisi"),
  buktiUrl: z.string().optional(),
  kontrakUrl: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().min(1, "Created by wajib diisi")
})

const UpdateKasBesarSchema = KasBesarSchema.partial().extend({
  id: z.string().min(1, "ID wajib diisi")
})

// GET - Ambil semua data kas besar
export async function GET(request: NextRequest) {

    
  try {
  // Check if prisma client is available
  if (!prisma) {
  return NextResponse.json(
  { success: false, error: 'Database connection not available' },
  { status: 503 }
  )
  }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    
    if (search) {
      where.OR = [
        { barang: { contains: search } },
        { vendorNama: { contains: search } },
        { tipeAktivitas: { contains: search } }
      ]
    }

    if (userId) {
      where.createdBy = userId
    }

    // Handle soft delete filter
    if (!includeDeleted) {
      where.deletedAt = null
    }

    const [expenses, total] = await Promise.all([
      prisma.kasBesarTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.kasBesarTransaction.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.apiError('/api/kas-besar GET', error)

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
          details: 'Unable to connect to the database. Please check your internet connection and try again.',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }

    // Return detailed error for debugging
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data kas besar',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Buat data kas besar baru
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = KasBesarSchema.parse(body)

    // Create expense
    const expense = await prisma.kasBesarTransaction.create({
      data: {
        ...validatedData,
        status: 'DRAFT'
      }
    })

    // TODO: Add audit logging when auditLog table is available

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Kas besar berhasil dibuat'
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

    logger.apiError('/api/kas-besar POST', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat kas besar' },
      { status: 500 }
    )
  }
}

// PUT - Update data kas besar
export async function PUT(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = UpdateKasBesarSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Get old data for audit
    const oldExpense = await prisma.kasBesarTransaction.findUnique({
      where: { id }
    })

    if (!oldExpense) {
      return NextResponse.json(
        { success: false, error: 'Data kas besar tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update expense
    const expense = await prisma.kasBesarTransaction.update({
      where: { id },
      data: updateData
    })

    // TODO: Add audit logging if needed
    // Note: auditLog table may not exist in current schema

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Kas besar berhasil diperbarui'
    })
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

    logger.apiError('/api/kas-besar PUT', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui kas besar' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus data kas besar
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
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: 'ID dan User ID wajib diisi' },
        { status: 400 }
      )
    }

    // Get data for audit
    const expense = await prisma.kasBesarTransaction.findUnique({
      where: { id }
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Data kas besar tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user can delete (only creator or admin)
    if (expense.createdBy !== userId) {
      // In production, add role checking here
      // const user = await prisma.user.findUnique({ where: { id: userId } })
      // if (user?.role !== 'admin') {
      //   return NextResponse.json(
      //     { success: false, error: 'Tidak memiliki akses untuk menghapus' },
      //     { status: 403 }
      //   )
      // }
    }

    // Delete expense
    await prisma.kasBesarTransaction.delete({
      where: { id }
    })

    // TODO: Add audit logging when auditLog table is available

    return NextResponse.json({
      success: true,
      message: 'Kas besar berhasil dihapus'
    })
  } catch (error) {
    logger.apiError('/api/kas-besar DELETE', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus kas besar' },
      { status: 500 }
    )
  }
}
