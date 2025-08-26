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

// GET - Ambil semua kwitansi
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const payrollRunId = searchParams.get('payrollRunId')
    const employeeId = searchParams.get('employeeId')
    const createdBy = searchParams.get('createdBy')
    
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null, // Only show non-deleted records
      ...(payrollRunId && { payrollRunId }),
      ...(employeeId && { employeeId }),
      ...(createdBy && { createdBy })
    }

    const [kwitansi, total] = await Promise.all([
      prisma.kwitansi.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          payrollRun: {
            select: { id: true, periodeAwal: true, periodeAkhir: true, status: true }
          },
          payrollLine: {
            select: { id: true, employeeName: true, neto: true }
          },
          employee: {
            select: { id: true, nama: true, jabatan: true, site: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.kwitansi.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: kwitansi,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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

// POST - Buat kwitansi baru
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

    const kwitansi = await prisma.kwitansi.create({
      data: validatedData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        payrollRun: {
          select: { id: true, periodeAwal: true, periodeAkhir: true, status: true }
        },
        payrollLine: {
          select: { id: true, employeeName: true, neto: true }
        },
        employee: {
          select: { id: true, nama: true, jabatan: true, site: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: kwitansi,
      message: 'Kwitansi berhasil dibuat'
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
        error: 'Gagal membuat kwitansi'
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
    const kwitansi = await prisma.kwitansi.findUnique({
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
      await prisma.kwitansi.delete({
        where: { id }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Kwitansi berhasil dihapus permanen'
      })
    } else {
      // Soft delete - mark as deleted
      await prisma.kwitansi.update({
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
