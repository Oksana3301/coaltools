import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET - Fetch all kas kecil expenses (excluding soft deleted)
export async function GET(request: NextRequest) {

    
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all'
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    
    const offset = (page - 1) * limit
    
    // Build where clause
    const whereClause: any = {}
    
    // Filter by status if specified
    if (status !== 'all') {
      whereClause.status = status
    }
    
    // Handle soft delete filter
    if (!includeDeleted) {
      whereClause.deletedAt = null
    }
    
    // Get expenses with pagination
    const expenses = await prisma.kasKecilExpense.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })
    
    // Get total count
    const totalCount = await prisma.kasKecilExpense.count({
      where: whereClause
    })
    
    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    logger.apiError('/api/kas-kecil GET', error)
    
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
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch expenses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create new kas kecil expense
export async function POST(request: NextRequest) {

    
  try {
    const body = await request.json()
    
    const expense = await prisma.kasKecilExpense.create({
      data: {
        hari: body.hari,
        tanggal: body.tanggal,
        bulan: body.bulan,
        tipeAktivitas: body.tipeAktivitas,
        barang: body.barang,
        banyak: parseFloat(body.banyak),
        satuan: body.satuan,
        hargaSatuan: parseFloat(body.hargaSatuan),
        total: parseFloat(body.total),
        vendorNama: body.vendorNama,
        vendorTelp: body.vendorTelp,
        vendorEmail: body.vendorEmail,
        jenis: body.jenis,
        subJenis: body.subJenis,
        buktiUrl: body.buktiUrl,
        status: body.status || 'DRAFT',
        notes: body.notes,
        createdBy: body.createdBy
      }
    })
    
    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Kas kecil berhasil dibuat'
    }, { status: 201 })
  } catch (error) {
    logger.apiError('/api/kas-kecil POST', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create expense',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
