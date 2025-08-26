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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Auto-generate kwitansi when payroll is approved
    if (status === 'APPROVED') {
      try {
        await generateKwitansiForPayroll(payrollRun)
      } catch (kwitansiError) {
        console.error('Error generating kwitansi:', kwitansiError)
        // Don't fail the payroll approval if kwitansi generation fails
      }
    }

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

// Function to generate kwitansi for approved payroll
async function generateKwitansiForPayroll(payrollRun: any) {
  const prisma = getPrismaClient()
  if (!prisma) return

  // Get current date for kwitansi
  const currentDate = new Date()
  const tanggalKwitansi = currentDate.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })

  // Generate kwitansi for each employee in the payroll
  for (const payrollLine of payrollRun.payrollLines) {
    const employee = payrollLine.employee
    
    // Generate unique kwitansi number
    const kwitansiCount = await prisma.kwitansi.count({
      where: {
        payrollRunId: payrollRun.id,
        employeeId: employee.id
      }
    })
    
    const nomorKwitansi = `KW-${payrollRun.id.slice(-6)}-${employee.id.slice(-4)}-${String(kwitansiCount + 1).padStart(3, '0')}`

    // Create kwitansi record
    await prisma.kwitansi.create({
      data: {
        nomorKwitansi,
        tanggal: currentDate.toISOString().split('T')[0],
        namaPenerima: employee.nama,
        jumlahUang: payrollLine.neto,
        untukPembayaran: `Gaji Karyawan ${employee.nama} untuk periode ${payrollRun.periodeAwal} - ${payrollRun.periodeAkhir}`,
        namaPembayar: 'PT. GLOBAL LESTARI ALAM',
        nomorRekening: employee.bankAccount || '',
        namaRekening: employee.nama,
        bankName: employee.bankName || 'BRI',
        transferMethod: 'Transfer ke rekening',
        tempat: 'Sawahlunto',
        tanggalKwitansi,
        signatureName: 'ATIKA DEWI SURYANI',
        signaturePosition: 'Accounting',
        materai: '',
        payrollRunId: payrollRun.id,
        payrollLineId: payrollLine.id,
        employeeId: employee.id,
        createdBy: payrollRun.createdBy
      }
    })
  }
}
