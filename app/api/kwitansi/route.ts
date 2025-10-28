import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

// Schema untuk validasi input kwitansi
const kwitansiSchema = z.object({
  nomorKwitansi: z.string().min(1, 'Nomor kwitansi wajib diisi'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  namaPenerima: z.string().min(1, 'Nama penerima wajib diisi'),
  jumlahUang: z.number().min(0, 'Jumlah uang harus positif'),
  untukPembayaran: z.string().min(1, 'Untuk pembayaran wajib diisi'),
  namaPembayar: z.string().min(1, 'Nama pembayar wajib diisi'),
  nomorRekening: z.string().optional(),
  namaRekening: z.string().optional(),
  bankName: z.string().optional(),
  transferMethod: z.string().optional(),
  tempat: z.string().min(1, 'Tempat wajib diisi'),
  tanggalKwitansi: z.string().min(1, 'Tanggal kwitansi wajib diisi'),
  signatureName: z.string().min(1, 'Nama tanda tangan wajib diisi'),
  signaturePosition: z.string().min(1, 'Jabatan tanda tangan wajib diisi'),
  materai: z.string().optional(),
  headerImage: z.string().optional(),
  payrollRunId: z.string().optional(),
  payrollLineId: z.string().optional(),
  employeeId: z.string().optional(),
  createdBy: z.string().min(1, 'Created by wajib diisi')
})

// GET - Ambil semua kwitansi dengan search dan filter
export async function GET(request: NextRequest) {
  const prisma = getPrismaClient()
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database connection not available' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100 records
    const search = searchParams.get('search') || ''
    const payrollRunId = searchParams.get('payrollRunId')
    const employeeId = searchParams.get('employeeId')
    const createdBy = searchParams.get('createdBy')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null, // Only show non-deleted records
      ...(payrollRunId && { payrollRunId }),
      ...(employeeId && { employeeId }),
      ...(createdBy && { createdBy }),
      ...(search && {
        OR: [
          { nomorKwitansi: { contains: search } },
          { namaPenerima: { contains: search } },
          { namaPembayar: { contains: search } },
          { untukPembayaran: { contains: search } }
        ]
      }),
      ...(dateFrom && dateTo && {
        tanggal: {
          gte: dateFrom,
          lte: dateTo
        }
      })
    }

    // Check total count and enforce 100 record limit
    const totalCount = await prisma.invoice.count({ 
      where: { deletedAt: null, ...(createdBy && { createdBy }) }
    })

    const [kwitansi, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,

        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: kwitansi,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      meta: {
        totalRecords: totalCount,
        isAtLimit: totalCount >= 100
      }
    })
  } catch (error) {
    console.error('Error fetching kwitansi:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data kwitansi'
      },
      { status: 500 }
    )
  }
}

// POST - Buat kwitansi baru dengan limit 100 records
export async function POST(request: NextRequest) {
  const prisma = getPrismaClient()
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database connection not available' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = kwitansiSchema.parse(body)

    // Check if user has reached 100 record limit
    const userRecordCount = await prisma.invoice.count({
      where: { 
        createdBy: validatedData.createdBy,
        deletedAt: null 
      }
    })

    // If at limit, auto-delete oldest record
    if (userRecordCount >= 100) {
      const oldestRecord = await prisma.invoice.findFirst({
        where: { 
          createdBy: validatedData.createdBy,
          deletedAt: null 
        },
        orderBy: { createdAt: 'asc' }
      })

      if (oldestRecord) {
        await prisma.invoice.update({
          where: { id: oldestRecord.id },
          data: { deletedAt: new Date() }
        })
      }
    }

    const kwitansi = await prisma.invoice.create({
      data: validatedData,

    })

    return NextResponse.json({
      success: true,
      data: kwitansi,
      message: 'Kwitansi berhasil disimpan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating kwitansi:', error)
    
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
        error: 'Gagal menyimpan kwitansi'
      },
      { status: 500 }
    )
  }
}

// PUT - Update kwitansi
export async function PUT(request: NextRequest) {
  const prisma = getPrismaClient()
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database connection not available' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID kwitansi wajib diisi'
        },
        { status: 400 }
      )
    }

    const validatedData = kwitansiSchema.partial().parse(updateData)

    const kwitansi = await prisma.invoice.update({
      where: { id },
      data: validatedData,

    })

    return NextResponse.json({
      success: true,
      data: kwitansi,
      message: 'Kwitansi berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating kwitansi:', error)
    
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
        error: 'Gagal mengupdate kwitansi'
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus kwitansi (soft delete by default, hard delete with force=true)
export async function DELETE(request: NextRequest) {
  const prisma = getPrismaClient()
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database connection not available' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const force = searchParams.get('force') === 'true'

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID kwitansi wajib diisi'
        },
        { status: 400 }
      )
    }

    // Check if kwitansi exists
    const kwitansi = await prisma.invoice.findUnique({
      where: { id },
      select: { deletedAt: true }
    })

    if (!kwitansi) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kwitansi tidak ditemukan'
        },
        { status: 404 }
      )
    }

    // If already soft deleted, only allow hard delete
    if (kwitansi.deletedAt && !force) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kwitansi sudah dihapus. Gunakan force=true untuk penghapusan permanen.'
        },
        { status: 400 }
      )
    }

    if (force) {
      // Hard delete - permanently remove from database
      await prisma.invoice.delete({
        where: { id }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Kwitansi berhasil dihapus permanen'
      })
    } else {
      // Soft delete - mark as deleted
      await prisma.invoice.update({
        where: { id },
        data: { deletedAt: new Date() }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Kwitansi berhasil dihapus (soft delete)'
      })
    }
  } catch (error) {
    console.error('Error deleting kwitansi:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus kwitansi'
      },
      { status: 500 }
    )
  }
}
