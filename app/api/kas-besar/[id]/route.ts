import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPrismaClient } from '@/lib/db'

// Use shared prisma client from lib/db
const prisma = getPrismaClient()

const StatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'ARCHIVED', 'REJECTED']),
  approvalNotes: z.string().optional(),
  approvedBy: z.string().optional()
})

// GET - Ambil data kas besar by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // prisma already initialized at top of file
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }
    
    const { id } = await params
    const expense = await prisma.kasBesarTransaction.findUnique({
      where: { id: id }
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Data kas besar tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: expense
    })
  } catch (error) {
    console.error('Error fetching kas besar:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data kas besar' },
      { status: 500 }
    )
  }
}

// PATCH - Update status kas besar (untuk approval workflow)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // prisma already initialized at top of file
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }
    
    const { id } = await params
    const body = await request.json()
    const validatedData = StatusUpdateSchema.parse(body)

    // Get old data for audit
    const oldExpense = await prisma.kasBesarTransaction.findUnique({
      where: { id: id }
    })

    if (!oldExpense) {
      return NextResponse.json(
        { success: false, error: 'Data kas besar tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update status
    const expense = await prisma.kasBesarTransaction.update({
      where: { id: id },
      data: {
        status: validatedData.status,
        notes: validatedData.approvalNotes
      }
    })

    // TODO: Add audit logging if needed
    // Note: auditLog table may not exist in current schema

    return NextResponse.json({
      success: true,
      data: expense,
      message: `Status berhasil diubah menjadi ${validatedData.status}`
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

    console.error('Error updating status:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status' },
      { status: 500 }
    )
  }
}
