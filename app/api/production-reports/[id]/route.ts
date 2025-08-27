import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

// GET - Ambil production report berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const productionReport = await prisma.productionReport.findUnique({
      where: { id },
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
      }
    })

    if (!productionReport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Laporan produksi tidak ditemukan'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: productionReport
    })
  } catch (error) {
    console.error('Error fetching production report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data laporan produksi'
      },
      { status: 500 }
    )
  }
}

// PUT - Update production report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, approvedBy, ...updateData } = body

    const productionReport = await prisma.productionReport.update({
      where: { id },
      data: {
        ...updateData,
        ...(status && { status }),
        ...(approvedBy && { approvedBy }),
        nettoTon: updateData.grossTon - updateData.tareTon // Recalculate netto
      },
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
      }
    })

    return NextResponse.json({
      success: true,
      data: productionReport,
      message: 'Laporan produksi berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating production report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate laporan produksi'
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus production report (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (hardDelete) {
      // Hard delete - completely remove from database
      await prisma.productionReport.delete({
        where: { id }
      })
    } else {
      // Soft delete - set deletedAt timestamp
      await prisma.productionReport.update({
        where: { id },
        data: { deletedAt: new Date() }
      })
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Laporan produksi berhasil dihapus permanen' : 'Laporan produksi berhasil diarsipkan'
    })
  } catch (error) {
    console.error('Error deleting production report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus laporan produksi'
      },
      { status: 500 }
    )
  }
}

// PATCH - Update status production report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, approvedBy, notes } = body

    // Validate status transition
    const currentReport = await prisma.productionReport.findUnique({
      where: { id },
      select: { status: true }
    })

    if (!currentReport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Laporan produksi tidak ditemukan'
        },
        { status: 404 }
      )
    }

    // Validate status transition rules
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['SUBMITTED', 'ARCHIVED'],
      'SUBMITTED': ['REVIEWED', 'DRAFT', 'ARCHIVED'],
      'REVIEWED': ['APPROVED', 'DRAFT', 'ARCHIVED'],
      'APPROVED': ['ARCHIVED'],
      'ARCHIVED': [] // Final status
    }

    const allowedNext = validTransitions[currentReport.status] || []
    if (status && !allowedNext.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tidak bisa mengubah status dari ${currentReport.status} ke ${status}`
        },
        { status: 400 }
      )
    }

    const productionReport = await prisma.productionReport.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(approvedBy && { approvedBy })
      },
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
      }
    })

    return NextResponse.json({
      success: true,
      data: productionReport,
      message: `Status laporan produksi berhasil diubah ke ${status}`
    })
  } catch (error) {
    console.error('Error updating production report status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate status laporan produksi'
      },
      { status: 500 }
    )
  }
}
