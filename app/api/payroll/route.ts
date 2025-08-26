import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

// Schema untuk validasi input payroll
const payrollRunSchema = z.object({
  periodeAwal: z.string().min(1, 'Periode awal wajib diisi'),
  periodeAkhir: z.string().min(1, 'Periode akhir wajib diisi'),
  createdBy: z.string().min(1, 'Created by wajib diisi'),
  employeeOverrides: z.array(z.object({
    employeeId: z.string(),
    hariKerja: z.number().min(0).max(31)
  })).optional()
})

// GET - Ambil semua payroll runs
export async function GET(request: NextRequest) {
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    
    const skip = (page - 1) * limit

    const where = {
      ...(status && { status: status as 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PAID' | 'ARCHIVED' }),
      ...(userId && { createdBy: userId })
    }

    const [payrollRuns, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payrollRun.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: payrollRuns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payroll runs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data payroll'
      },
      { status: 500 }
    )
  }
}

// POST - Buat payroll run baru
export async function POST(request: NextRequest) {
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
  try {
    const body = await request.json()
    const validatedData = payrollRunSchema.parse(body)

    // Get active employees
    const employees = await prisma.employee.findMany({
      where: { aktif: true }
    })

    // Get active pay components
    const payComponents = await prisma.payComponent.findMany({
      where: { aktif: true },
      orderBy: { order: 'asc' }
    })

    // Calculate payroll for each employee
    const payrollCalculations = employees.map(employee => {
      // Check if there's an override for working days
      const override = validatedData.employeeOverrides?.find(
        o => o.employeeId === employee.id
      )
      const hariKerja = override?.hariKerja || 22 // Default 22 working days

      // Basic calculations
      const upahHarian = employee.kontrakUpahHarian
      const uangMakanHarian = employee.defaultUangMakan
      const uangBbmHarian = employee.defaultUangBbm
      
      let bruto = (upahHarian * hariKerja) + 
                  (uangMakanHarian * hariKerja) + 
                  (uangBbmHarian * hariKerja)
      
      let totalEarnings = 0
      let totalDeductions = 0
      let taxableAmount = bruto

      const components: any[] = []

      // Calculate earning components
      payComponents
        .filter(comp => comp.tipe === 'EARNING')
        .forEach(comp => {
          let amount = 0
          
          switch (comp.metode) {
            case 'FLAT':
              amount = comp.nominal || 0
              break
            case 'PER_HARI':
              amount = (comp.rate || 0) * hariKerja
              break
            case 'PERSENTASE':
              const basis = comp.basis === 'UPAH_HARIAN' 
                ? upahHarian * hariKerja 
                : bruto
              amount = basis * ((comp.rate || 0) / 100)
              break
          }
          
          // Apply caps
          if (comp.capMin && amount < comp.capMin) amount = comp.capMin
          if (comp.capMax && amount > comp.capMax) amount = comp.capMax
          
          components.push({
            componentId: comp.id,
            componentName: comp.nama,
            amount,
            taxable: comp.taxable
          })
          
          totalEarnings += amount
          if (comp.taxable) {
            taxableAmount += amount
          }
        })

      bruto += totalEarnings

      // Calculate tax (simplified 2%)
      const pajakRate = 2
      const pajakNominal = taxableAmount * (pajakRate / 100)

      // Calculate deduction components
      payComponents
        .filter(comp => comp.tipe === 'DEDUCTION')
        .forEach(comp => {
          let amount = 0
          
          switch (comp.metode) {
            case 'FLAT':
              amount = comp.nominal || 0
              break
            case 'PER_HARI':
              amount = (comp.rate || 0) * hariKerja
              break
            case 'PERSENTASE':
              const basis = comp.basis === 'BRUTO' ? bruto : upahHarian * hariKerja
              amount = basis * ((comp.rate || 0) / 100)
              break
          }
          
          // Apply caps
          if (comp.capMin && amount < comp.capMin) amount = comp.capMin
          if (comp.capMax && amount > comp.capMax) amount = comp.capMax
          
          components.push({
            componentId: comp.id,
            componentName: comp.nama,
            amount,
            taxable: comp.taxable
          })
          
          totalDeductions += amount
        })

      const neto = bruto - pajakNominal - totalDeductions

      return {
        employeeId: employee.id,
        employeeName: employee.nama,
        hariKerja,
        upahHarian,
        uangMakanHarian,
        uangBbmHarian,
        bruto,
        pajakRate,
        pajakNominal,
        neto,
        components
      }
    })

    // Create payroll run with transaction
    const payrollRun = await prisma.$transaction(async (tx) => {
      // Create payroll run
      const newPayrollRun = await tx.payrollRun.create({
        data: {
          periodeAwal: validatedData.periodeAwal,
          periodeAkhir: validatedData.periodeAkhir,
          createdBy: validatedData.createdBy,
          status: 'DRAFT'
        }
      })

      // Create payroll lines
      for (const calc of payrollCalculations) {
        const payrollLine = await tx.payrollLine.create({
          data: {
            payrollRunId: newPayrollRun.id,
            employeeId: calc.employeeId,
            employeeName: calc.employeeName,
            hariKerja: calc.hariKerja,
            upahHarian: calc.upahHarian,
            uangMakanHarian: calc.uangMakanHarian,
            uangBbmHarian: calc.uangBbmHarian,
            bruto: calc.bruto,
            pajakRate: calc.pajakRate,
            pajakNominal: calc.pajakNominal,
            neto: calc.neto,
            status: 'DRAFT'
          }
        })

        // Create payroll line components
        for (const comp of calc.components) {
          await tx.payrollLineComponent.create({
            data: {
              payrollLineId: payrollLine.id,
              componentId: comp.componentId,
              componentName: comp.componentName,
              amount: comp.amount,
              taxable: comp.taxable
            }
          })
        }
      }

      return newPayrollRun
    })

    // Fetch the complete payroll run with relations
    const completePayrollRun = await prisma.payrollRun.findUnique({
      where: { id: payrollRun.id },
      include: {
        creator: {
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
      data: completePayrollRun,
      message: 'Payroll berhasil dibuat'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll run:', error)
    
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
        error: 'Gagal membuat payroll'
      },
      { status: 500 }
    )
  }
}

// PUT - Update payroll run
export async function PUT(request: NextRequest) {
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
  try {
    const body = await request.json()
    const { id, status, approvedBy, payrollLines, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID payroll wajib diisi'
        },
        { status: 400 }
      )
    }

    const payrollRun = await prisma.$transaction(async (tx) => {
      // Update payroll run
      const updatedRun = await tx.payrollRun.update({
        where: { id },
        data: {
          ...updateData,
          ...(status && { status }),
          ...(approvedBy && { approvedBy })
        }
      })

      // Update payroll lines if provided
      if (payrollLines && Array.isArray(payrollLines)) {
        for (const line of payrollLines) {
          if (line.id) {
            await tx.payrollLine.update({
              where: { id: line.id },
              data: {
                hariKerja: line.hariKerja,
                neto: line.neto,
                // Recalculate if needed
              }
            })
          }
        }
      }

      return updatedRun
    })

    // Fetch complete data
    const completePayrollRun = await prisma.payrollRun.findUnique({
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
              select: { id: true, nama: true, jabatan: true, site: true }
            },
            components: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: completePayrollRun,
      message: 'Payroll berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating payroll run:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate payroll'
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus payroll run (soft delete by default, hard delete with force=true)
export async function DELETE(request: NextRequest) {
    const prisma = getPrismaClient();
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
          error: 'ID payroll wajib diisi'
        },
        { status: 400 }
      )
    }

    // Check if payroll exists and can be deleted
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      select: { status: true, deletedAt: true }
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

    // If already soft deleted, only allow hard delete
    if (payrollRun.deletedAt && !force) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payroll sudah dihapus. Gunakan force=true untuk penghapusan permanen.'
        },
        { status: 400 }
      )
    }

    // For hard delete, only allow DRAFT status
    if (force && payrollRun.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Hanya payroll dengan status DRAFT yang bisa dihapus permanen'
        },
        { status: 400 }
      )
    }

    if (force) {
      // Hard delete - permanently remove from database
      await prisma.payrollRun.delete({
        where: { id }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Payroll berhasil dihapus permanen'
      })
    } else {
      // Soft delete - mark as deleted
      await prisma.payrollRun.update({
        where: { id },
        data: { deletedAt: new Date() }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Payroll berhasil dihapus (soft delete)'
      })
    }
  } catch (error) {
    console.error('Error deleting payroll run:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus payroll'
      },
      { status: 500 }
    )
  }
}
