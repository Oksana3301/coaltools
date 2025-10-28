import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const dynamic = "force-static"

// GET - Ambil buyer berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // prisma already initialized above

    const buyer = await prisma.buyer.findUnique({
      where: { id }
    })

    if (!buyer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pembeli tidak ditemukan'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: buyer
    })
  } catch (error) {
    console.error('Error fetching buyer:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data pembeli'
      },
      { status: 500 }
    )
  }
}

// PUT - Update buyer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    // prisma already initialized above

    const buyer = await prisma.buyer.update({
      where: { id },
      data: body
    })

    return NextResponse.json({
      success: true,
      data: buyer,
      message: 'Pembeli berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating buyer:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate pembeli'
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus buyer (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hardDelete') === 'true'
    // prisma already initialized above

    if (hardDelete) {
      // Hard delete - completely remove from database
      await prisma.buyer.delete({
        where: { id }
      })
    } else {
      // Soft delete - set aktif to false
      await prisma.buyer.update({
        where: { id },
        data: { updatedAt: new Date() }
      })
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Pembeli berhasil dihapus permanen' : 'Pembeli berhasil dinonaktifkan'
    })
  } catch (error) {
    console.error('Error deleting buyer:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus pembeli'
      },
      { status: 500 }
    )
  }
}
