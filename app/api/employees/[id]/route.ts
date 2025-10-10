import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

// GET - Ambil karyawan berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }
    
    const { id } = await params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        payrollLines: {
          include: {
            payrollRun: true
          },
          orderBy: { created_at: 'desc' },
          take: 5
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Karyawan tidak ditemukan'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data karyawan'
      },
      { status: 500 }
    )
  }
}

// PUT - Update karyawan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }
    
    const { id } = await params
    const body = await request.json()

    const employee = await prisma.employee.update({
      where: { id },
      data: body
    })

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Karyawan berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate karyawan'
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus karyawan (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }
    
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (hardDelete) {
      // Hard delete - completely remove from database
      await prisma.employee.delete({
        where: { id }
      })
    } else {
      // Soft delete - set aktif to false
      await prisma.employee.update({
        where: { id },
        data: { aktif: false }
      })
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Karyawan berhasil dihapus permanen' : 'Karyawan berhasil dinonaktifkan'
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus karyawan'
      },
      { status: 500 }
    )
  }
}
