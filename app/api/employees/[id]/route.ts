import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Ambil karyawan berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        payrollLines: {
          include: {
            payrollRun: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        attendanceRecords: {
          orderBy: { tanggal: 'desc' },
          take: 10
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
