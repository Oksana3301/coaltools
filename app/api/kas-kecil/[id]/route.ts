import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

// GET - Fetch single kas kecil expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.kasKecilExpense.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error fetching kas kecil expense:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

// PUT - Update kas kecil expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const expense = await prisma.kasKecilExpense.update({
      where: {
        id: params.id,
        deletedAt: null
      },
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
        status: body.status,
        notes: body.notes,
        approvalNotes: body.approvalNotes
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error updating kas kecil expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete kas kecil expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hardDelete') === 'true'
    
    if (hardDelete) {
      // Hard delete - completely remove from database
      await prisma.kasKecilExpense.delete({
        where: { id: params.id }
      })
    } else {
      // Soft delete - set deletedAt timestamp
      await prisma.kasKecilExpense.update({
        where: { id: params.id },
        data: { deletedAt: new Date() }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: hardDelete ? 'Expense permanently deleted' : 'Expense soft deleted'
    })
  } catch (error) {
    console.error('Error deleting kas kecil expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}

// PATCH - Restore soft deleted expense
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    if (body.action === 'restore') {
      const expense = await prisma.kasKecilExpense.update({
        where: { id: params.id },
        data: { deletedAt: null },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
      
      return NextResponse.json(expense)
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error restoring kas kecil expense:', error)
    return NextResponse.json(
      { error: 'Failed to restore expense' },
      { status: 500 }
    )
  }
}
