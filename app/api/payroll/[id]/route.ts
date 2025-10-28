import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

// GET - Ambil payroll run berdasarkan ID
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

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        payrollLines: {
          include: {
            employee: true
          }
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
    const prisma = getPrismaClient()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }
    
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

    // Validate status transition rules (using database enum values)
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['SUBMITTED', 'REJECTED', 'APPROVED'],
      'SUBMITTED': ['APPROVED', 'REJECTED', 'DRAFT'],
      'APPROVED': ['PAID'],
      'PAID': [],
      'REJECTED': ['DRAFT']
    }

    const allowedNext = validTransitions[currentPayroll.status || 'DRAFT'] || []
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
        error: 'Gagal mengupdate status payroll',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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

  // Get complete payroll data with employee relationships
  const completePayrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRun.id },
    include: {
      payrollLines: {
        include: {
          employee: true
        }
      }
    }
  })

  if (!completePayrollRun?.payrollLines) {
    console.error('No payroll lines found for payroll run:', payrollRun.id)
    return
  }

  // Generate kwitansi for each employee in the payroll
  for (const payrollLine of completePayrollRun.payrollLines) {
    const employee = payrollLine.employee
    
    if (!employee) {
      console.error('Employee not found for payroll line:', payrollLine.id)
      continue
    }
    
    // Generate unique kwitansi number
    const kwitansiCount = await prisma.kwitansi.count({
      where: {
        payrollRunId: payrollRun.id,
        employeeId: employee.id
      }
    })
    
    const nomorKwitansi = `KW-${payrollRun.id.slice(-6)}-${employee.id.slice(-4)}-${String(kwitansiCount + 1).padStart(3, '0')}`

    try {
      // Create kwitansi record
      await prisma.kwitansi.create({
        data: {
          nomorKwitansi,
          tanggal: currentDate.toISOString().split('T')[0],
          namaPenerima: employee.nama || payrollLine.employeeName,
          jumlah: Number(payrollLine.neto),
          untukPembayaran: `Gaji Karyawan ${employee.nama || payrollLine.employeeName} untuk periode ${payrollRun.periodeAwal} - ${payrollRun.periodeAkhir}`,
          namaPembayar: 'PT. GLOBAL LESTARI ALAM',
          payrollRunId: payrollRun.id,
          employeeId: employee.id,
          createdBy: payrollRun.createdBy
        }
      })
      // Kwitansi created for employee
    } catch (error) {
      console.error(`Error creating kwitansi for employee ${employee.nama || payrollLine.employeeName}:`, error)
    }
  }
  
  // Generated kwitansi for payroll run
}
