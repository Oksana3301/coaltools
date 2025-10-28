import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Schema untuk validasi input payroll
const payrollRunSchema = z.object({
  periodeAwal: z.string().min(1, 'Periode awal wajib diisi'),
  periodeAkhir: z.string().min(1, 'Periode akhir wajib diisi'),
  createdBy: z.string().min(1, 'Created by wajib diisi'),
  customFileName: z.string().max(1000).optional(),
  notes: z.string().optional(),
  employeeOverrides: z.array(z.object({
    employeeId: z.string(),
    hariKerja: z.number().min(0).max(31),
    overtimeHours: z.number().optional(),
    overtimeRate: z.number().optional(),
    overtimeAmount: z.number().optional(),
    normalHours: z.number().optional(),
    holidayHours: z.number().optional(),
    nightFirstHour: z.number().optional(),
    nightAdditionalHours: z.number().optional(),
    customHourlyRate: z.number().optional(),
    cashbon: z.number().optional(),
    selectedStandardComponents: z.array(z.string()).optional(),
    selectedAdditionalComponents: z.array(z.string()).optional(),
    customComponents: z.array(z.any()).optional()
  })).optional()
})

// GET - Ambil semua payroll runs
export async function GET(request: NextRequest) {
    // prisma already initialized above,
        { status: 503 }
      )
    }

    
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    
    const offset = (page - 1) * limit

    const where: any = {
      ...(userId && { createdBy: userId })
    }
    
    // Add status filter only if provided and valid
    if (status && Object.values(['DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED']).includes(status)) {
      where.status = status
    }

    // Use regular Prisma query
    const [payrollRuns, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where: where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.payrollRun.count({ where })
    ])

    // Get payroll lines for each run
    const payrollRunsWithLines = await Promise.all(
      payrollRuns.map(async (run) => {
        const payrollLines = await prisma.payrollLine.findMany({
          where: { payrollRunId: run.id },
          include: {
            employee: {
              select: { id: true, nama: true, jabatan: true, site: true }
            }
          }
        })
        
        return {
          ...run,
          payrollLines
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: payrollRunsWithLines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payroll runs:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data payroll',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Buat payroll run baru
export async function POST(request: NextRequest) {
  try {
    // prisma already initialized above,
        { status: 503 }
      )
    }

    // Test database connection before proceeding
    try {
      await prisma.$connect()
    } catch (dbError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 503 }
      )
    }

    // Main logic starts here
    const body = await request.json()
    
    const validatedData = payrollRunSchema.parse(body)

    // Get active employees
    let employees = []
    try {
      employees = await prisma.employee.findMany({
        where: { aktif: true }
      })
      // Found active employees
    } catch (empError) {
      console.error('❌ Error fetching employees:', empError)
      return NextResponse.json({
        success: false,
        error: 'Gagal mengambil data karyawan',
        details: empError instanceof Error ? empError.message : 'Unknown error'
      }, { status: 500 })
    }

    if (employees.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak ada karyawan aktif untuk membuat payroll'
      }, { status: 400 })
    }

    // Get active pay components - with error handling
    let payComponents: any[] = []
    try {
      payComponents = await prisma.payComponent.findMany({
        where: { aktif: true },
        orderBy: { order: 'asc' }
      })
    } catch (compError) {
      // Continue without pay components if there's an error
    }

    // Calculate payroll for each employee
    
    const payrollCalculations = employees.map(employee => {
      // Check if there's an override for working days and other details
      const override = validatedData.employeeOverrides?.find(
        o => o.employeeId === employee.id
      )
      const hariKerja = override?.hariKerja || 22 // Default 22 working days

      // Basic calculations (convert Decimal to number to avoid calculation issues)
      const upahHarian = Number(employee.kontrakUpahHarian)
      const uangMakanHarian = Number(employee.defaultUangMakan)
      const uangBbmHarian = Number(employee.defaultUangBbm)
      
      let bruto = (upahHarian * hariKerja) + 
                  (uangMakanHarian * hariKerja) + 
                  (uangBbmHarian * hariKerja)
      
      // Add overtime if provided in override
      let overtimeAmount = 0
      if (override) {
        // Use detailed overtime calculation if available
        if (override.normalHours || override.holidayHours || override.nightFirstHour || override.nightAdditionalHours) {
          const hourlyRate = override.customHourlyRate || Math.round((upahHarian * 22) / 173)
          overtimeAmount += (override.normalHours || 0) * hourlyRate * 1.5
          overtimeAmount += (override.holidayHours || 0) * hourlyRate * 2  
          overtimeAmount += (override.nightFirstHour || 0) * hourlyRate * 1.5
          overtimeAmount += (override.nightAdditionalHours || 0) * hourlyRate * 2
        } else if (override.overtimeHours && override.overtimeRate) {
          // Use legacy overtime calculation
          overtimeAmount = override.overtimeHours * override.overtimeRate
        } else if (override.overtimeAmount) {
          // Use direct overtime amount
          overtimeAmount = override.overtimeAmount
        }
      }
      
      bruto += overtimeAmount
      
      let totalEarnings = 0
      let totalDeductions = 0
      let taxableAmount = bruto
      
      // Add cashbon to deductions if provided
      if (override?.cashbon) {
        totalDeductions += override.cashbon
      }

      const components: any[] = []
      
      // Process selected components from override if available
      const selectedComponentIds = [
        ...(override?.selectedStandardComponents || []),
        ...(override?.selectedAdditionalComponents || [])
      ]

      // Calculate earning components (only if selected in override, otherwise use all)
      payComponents
        .filter(comp => comp.tipe === 'EARNING')
        .filter(comp => selectedComponentIds.length === 0 || selectedComponentIds.includes(comp.id))
        .forEach(comp => {
          let amount = 0
          
          switch (comp.metode) {
            case 'FLAT':
              amount = Number(comp.nominal) || 0
              break
            case 'PER_HARI':
              amount = (Number(comp.rate) || 0) * hariKerja
              break
            case 'PERSENTASE':
              const basis = comp.basis === 'UPAH_HARIAN' 
                ? upahHarian * hariKerja 
                : bruto
              amount = basis * ((Number(comp.rate) || 0) / 100)
              break
          }
          
          // Apply caps
          if (comp.capMin && amount < Number(comp.capMin)) amount = Number(comp.capMin)
          if (comp.capMax && amount > Number(comp.capMax)) amount = Number(comp.capMax)
          
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

      // Tax calculation removed - users must configure tax manually via pay components
      // const pajakRate = 2
      // const pajakNominal = taxableAmount * (pajakRate / 100)
      const pajakRate = 0  // No automatic tax rate
      const pajakNominal = 0  // No automatic tax - use pay components for tax configuration

      // Calculate deduction components (only if selected in override, otherwise use all)
      payComponents
        .filter(comp => comp.tipe === 'DEDUCTION')
        .filter(comp => selectedComponentIds.length === 0 || selectedComponentIds.includes(comp.id))
        .forEach(comp => {
          let amount = 0
          
          switch (comp.metode) {
            case 'FLAT':
              amount = Number(comp.nominal) || 0
              break
            case 'PER_HARI':
              amount = (Number(comp.rate) || 0) * hariKerja
              break
            case 'PERSENTASE':
              const basis = comp.basis === 'BRUTO' ? bruto : upahHarian * hariKerja
              amount = basis * ((Number(comp.rate) || 0) / 100)
              break
          }
          
          // Apply caps
          if (comp.capMin && amount < Number(comp.capMin)) amount = Number(comp.capMin)
          if (comp.capMax && amount > Number(comp.capMax)) amount = Number(comp.capMax)
          
          components.push({
            componentId: comp.id,
            componentName: comp.nama,
            amount,
            taxable: comp.taxable
          })
          
          totalDeductions += amount
        })

      // Process custom components from override
      if (override?.customComponents) {
        override.customComponents.forEach((customComp: any) => {
          if (customComp.nama) {
            const amount = customComp.nominal || 0
            if (customComp.tipe === 'EARNING') {
              totalEarnings += amount
              if (customComp.taxable) {
                taxableAmount += amount
              }
            } else {
              totalDeductions += amount
            }
            
            components.push({
              componentId: `custom_${customComp.nama}`,
              componentName: customComp.nama,
              amount: customComp.tipe === 'DEDUCTION' ? -amount : amount,
              taxable: customComp.taxable || false
            })
          }
        })
      }

      const neto = bruto - pajakNominal - totalDeductions

      return {
        employeeId: employee.id,
        employeeName: employee.nama,
        hariKerja,
        upahHarian,
        uangMakanHarian,
        uangBbmHarian,
        overtimeHours: override?.overtimeHours || 0,
        overtimeRate: override?.overtimeRate || 1.5,
        overtimeAmount,
        normalHours: override?.normalHours || 0,
        holidayHours: override?.holidayHours || 0,
        nightFirstHour: override?.nightFirstHour || 0,
        nightAdditionalHours: override?.nightAdditionalHours || 0,
        customHourlyRate: override?.customHourlyRate || 0,
        cashbon: override?.cashbon || 0,
        bruto,
        pajakRate,
        pajakNominal,
        neto,
        components
      }
    })

    // Create payroll run with transaction
    let payrollRun
    try {
      payrollRun = await prisma.$transaction(async (tx) => {
      // Skip user creation since User table relations are disabled
      const userId = validatedData.createdBy || 'system'

      // Create payroll run
      const payrollRunData = {
        periodeAwal: validatedData.periodeAwal,
        periodeAkhir: validatedData.periodeAkhir,
        createdBy: userId,
        status: 'DRAFT' as any,
        customFileName: validatedData.customFileName,
        notes: validatedData.notes
      }
      
      const newPayrollRun = await tx.payrollRun.create({
        data: payrollRunData
      })

      // Create payroll lines
      // Creating payroll lines for employees
      for (const calc of payrollCalculations) {
        // Creating payroll line for employee
        const payrollLine = await tx.payrollLine.create({
          data: {
            payrollRunId: newPayrollRun.id,
            employeeId: calc.employeeId,
            employeeName: calc.employeeName,
            hariKerja: calc.hariKerja,
            upahHarian: calc.upahHarian,
            uangMakanHarian: calc.uangMakanHarian,
            uangBbmHarian: calc.uangBbmHarian,
            overtimeHours: calc.overtimeHours || 0,
            overtimeRate: calc.overtimeRate || 1.5,
            cashbon: calc.cashbon || 0,
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
              componentType: comp.componentType || 'EARNING',
              amount: comp.amount,
              taxable: comp.taxable
            }
          })
        }
      }

      return newPayrollRun
    })
    } catch (transactionError) {
      return NextResponse.json({
        success: false,
        error: 'Gagal membuat payroll',
        details: transactionError instanceof Error ? transactionError.message : 'Transaction failed'
      }, { status: 500 })
    }

    // Fetch the complete payroll run with relations
    let completePayrollRun
    try {
      completePayrollRun = await prisma.payrollRun.findUnique({
        where: { id: payrollRun.id }
      })
    } catch (fetchError) {
      // Still return success since payroll was created
      completePayrollRun = payrollRun
    }

    return NextResponse.json({
      success: true,
      data: completePayrollRun,
      message: 'Payroll berhasil dibuat'
    }, { status: 201 })
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

    // Return detailed error for debugging
    const errorResponse = {
      success: false,
      error: 'Gagal membuat payroll',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      requestInfo: {
        method: 'POST',
        url: '/api/payroll'
      }
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// PUT - Update payroll run
export async function PUT(request: NextRequest) {
    // prisma already initialized above,
        { status: 503 }
      )
    }

  try {
    // Parsing PUT request body
    const body = await request.json()
    // Processing payroll update request
    
    const { id, status, approvedBy, payrollLines, employeeOverrides, ...updateData } = body
    // Extracted data for processing

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
          ...(approvedBy && { approvedBy }),
          updated_at: new Date()
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

    // Fetch complete data with payrollLines
    const completePayrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        payrollLines: {
          include: {
            employee: true
          }
        }
        // Temporarily disable user relations to avoid foreign key errors
        // creator: {
        //   select: { id: true, name: true, email: true }
        // },
        // approver: {
        //   select: { id: true, name: true, email: true }
        // }
      }
    })

    return NextResponse.json({
      success: true,
      data: completePayrollRun,
      message: 'Payroll berhasil diupdate'
    })
  } catch (error) {
    console.error('🔥 Error updating payroll run:', error)
    console.error('🔥 Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('🔥 Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('🔥 Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate payroll',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus payroll run (soft delete by default, hard delete with force=true)
export async function DELETE(request: NextRequest) {
    // prisma already initialized above,
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
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus payroll'
      },
      { status: 500 }
    )
  }
}
