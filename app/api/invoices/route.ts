import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

// Schema untuk validasi input invoice
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Nomor invoice wajib diisi'),
  createdDate: z.string().min(1, 'Tanggal pembuatan wajib diisi'),
  dueDate: z.string().optional(),
  applicantName: z.string().min(1, 'Nama pemohon wajib diisi'),
  recipientName: z.string().min(1, 'Nama penerima wajib diisi'),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  headerImage: z.string().optional(),
  showBankDetails: z.boolean().default(false),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
  transferMethod: z.string().optional(),
  signatureName: z.string().optional(),
  signaturePosition: z.string().optional(),
  signatureLocation: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    description: z.string(),
    quantity: z.number(),
    price: z.number(),
    discount: z.number().optional().default(0),
    tax: z.number().optional().default(0),
    total: z.number()
  })).default([]),
  subtotal: z.number().default(0),
  discount: z.number().default(0),
  tax: z.number().default(0),
  total: z.number().default(0)
})

// GET - Ambil semua invoices dengan search dan filter
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
    const createdBy = searchParams.get('createdBy')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null // Only show non-deleted records
    }

    // Check total count and enforce 100 record limit
    const totalCount = await prisma.invoice.count({ 
      where: { deletedAt: null }
    })

    const [invoices, total] = await Promise.all([
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
      data: invoices,
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
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data invoice'
      },
      { status: 500 }
    )
  }
}

// POST - Buat invoice baru dengan limit 100 records
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
    const validatedData = invoiceSchema.parse(body)

    // Check if user has reached 100 record limit
    const userRecordCount = await prisma.invoice.count({
      where: { 
        deletedAt: null 
      }
    })

    // If at limit, auto-delete oldest record
    if (userRecordCount >= 100) {
      const oldestRecord = await prisma.invoice.findFirst({
        where: { 
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

    const invoice = await prisma.invoice.create({
      data: {
        number: validatedData.invoiceNumber,
        buyerName: validatedData.recipientName,
        amount: validatedData.total,
        tax: validatedData.tax,
        total: validatedData.total,
        dueDate: new Date(validatedData.createdDate),
        status: 'DRAFT',
        description: validatedData.notes
      }
    })

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice berhasil disimpan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    
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
        error: 'Gagal menyimpan invoice'
      },
      { status: 500 }
    )
  }
}

// PUT - Update invoice
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
          error: 'ID invoice wajib diisi'
        },
        { status: 400 }
      )
    }

    const validatedData = invoiceSchema.partial().parse(updateData)

    const updatePayload: any = { ...validatedData }
    if (updatePayload.items) {
      updatePayload.items = JSON.stringify(updatePayload.items)
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updatePayload,
    })

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    
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
        error: 'Gagal mengupdate invoice'
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus invoice (soft delete by default, hard delete with force=true)
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
          error: 'ID invoice wajib diisi'
        },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { deletedAt: true }
    })

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice tidak ditemukan'
        },
        { status: 404 }
      )
    }

    // If already soft deleted, only allow hard delete
    if (invoice.deletedAt && !force) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice sudah dihapus. Gunakan force=true untuk penghapusan permanen.'
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
        message: 'Invoice berhasil dihapus permanen'
      })
    } else {
      // Soft delete - mark as deleted
      await prisma.invoice.update({
        where: { id },
        data: { deletedAt: new Date() }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Invoice berhasil dihapus (soft delete)'
      })
    }
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus invoice'
      },
      { status: 500 }
    )
  }
}
