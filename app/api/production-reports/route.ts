import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

// Schema untuk validasi input production report
const productionReportSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  nopol: z.string().min(1, 'Nopol wajib diisi'),
  pembeliId: z.string().optional(),
  pembeliNama: z.string().min(1, 'Nama pembeli wajib diisi'),
  tujuan: z.string().min(1, 'Tujuan wajib diisi'),
  grossTon: z.number().positive('Gross ton harus positif'),
  tareTon: z.number().positive('Tare ton harus positif'),
  nettoTon: z.number().positive('Netto ton harus positif'),
  sourceFile: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().min(1, 'Created by wajib diisi')
})

// GET - Ambil semua production reports
export async function GET(request: NextRequest) {
    const prisma = getPrismaClient();
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
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    
    const skip = (page - 1) * limit

    const where = {
      ...(status && { status: status as 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED' }),
      ...(userId && { createdBy: userId }),
      ...(includeDeleted ? {} : { deletedAt: null })
    }

    const [productionReports, total] = await Promise.all([
      prisma.productionReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          approver: {
            select: { id: true, name: true, email: true }
          },
          buyer: {
            select: { id: true, nama: true, hargaPerTonDefault: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.productionReport.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: productionReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching production reports:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data laporan produksi'
      },
      { status: 500 }
    )
  }
}

// POST - Buat production report baru
export async function POST(request: NextRequest) {
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
  try {
    const body = await request.json()
    const validatedData = productionReportSchema.parse(body)

    const productionReport = await prisma.productionReport.create({
      data: {
        ...validatedData,
        nettoTon: validatedData.grossTon - validatedData.tareTon // Ensure netto is calculated correctly
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        buyer: {
          select: { id: true, nama: true, hargaPerTonDefault: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: productionReport,
      message: 'Laporan produksi berhasil dibuat'
    })
  } catch (error) {
    console.error('Error creating production report:', error)
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
        error: 'Gagal membuat laporan produksi'
      },
      { status: 500 }
    )
  }
}
