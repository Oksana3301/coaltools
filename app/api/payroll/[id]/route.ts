import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

// GET - Ambil payroll run berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        approver: {
          select: { id: true, name: true, email: true }
        },
        payrollLines: {
          include: {
            employee: {
              select: { 
                id: true, 
                nama: true, 
                jabatan: true, 
                site: true,
                bankName: true,
                bankAccount: true,
                npwp: true
              }
            },
            components: {
              include: {
                payComponent: {
                  select: {
                    id: true,
                    nama: true,
                    tipe: true,
                    taxable: true
                  }
                }
              }
            }
          },
          orderBy: { employeeName: 'asc' }
        }
      }
    })

    if (!payrollRun) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payroll tidak ditemukan'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payrollRun
    })
  } catch (error) {
    console.error('Error fetching payroll run:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data payroll'
      },
      { status: 500 }
    )
  }
}

// PATCH - Update status payroll run
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, approvedBy, notes } = body

    // Validate status transition
    const currentPayroll = await prisma.payrollRun.findUnique({
      where: { id },
      select: { status: true }
    })

    if (!currentPayroll) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payroll tidak ditemukan'
        },
        { status: 404 }
      )
    }

    // Validate status transition rules
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['REVIEWED', 'ARCHIVED'],
      'REVIEWED': ['APPROVED', 'DRAFT', 'ARCHIVED'],
      'APPROVED': ['PAID', 'ARCHIVED'],
      'PAID': ['ARCHIVED'], // Allow archiving paid payrolls
      'ARCHIVED': [] // Final status
    }

    const allowedNext = validTransitions[currentPayroll.status] || []
    if (status && !allowedNext.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tidak bisa mengubah status dari ${currentPayroll.status} ke ${status}`
        },
        { status: 400 }
      )
    }

    const payrollRun = await prisma.payrollRun.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(approvedBy && { approvedBy }),
        ...(notes && { 
          // You might want to add a notes field to the schema
        })
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        approver: {
          select: { id: true, name: true, email: true }
        },
        payrollLines: {
          include: {
            employee: {
              select: { id: true, nama: true, jabatan: true, site: true }
            },
            components: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: payrollRun,
      message: `Status payroll berhasil diubah ke ${status}`
    })
  } catch (error) {
    console.error('Error updating payroll status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate status payroll'
      },
      { status: 500 }
    )
  }
}
