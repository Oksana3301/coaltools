import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


// Use shared prisma client from lib/db


/**
 * Interface untuk data payroll yang akan disimpan
 */
interface PayrollSaveData {
  employees: Array<{
    id: string
    name: string
    position: string
    basicSalary: number
    allowances: number
    deductions: number
    netSalary: number
    workingDays: number
    overtimeHours: number
    overtimePay: number
    components: Array<{
      name: string
      amount: number
      type: 'earning' | 'deduction'
    }>
  }>
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
  }
  payrollPeriod: {
    month: number
    year: number
    startDate: string
    endDate: string
  }
  summary: {
    totalEmployees: number
    totalBruto: number
    totalPajak: number
    totalNeto: number
  }
}

/**
 * POST /api/payroll/save
 * Menyimpan data payroll ke database dengan validasi dan safety checks
 */
export async function POST(request: NextRequest) {
  try {
  // Check if prisma client is available
  if (!prisma) {
  return NextResponse.json(
  { success: false, error: 'Database connection not available' },
  { status: 503 }
  )
  }

    const body = await request.json()
    const { employees, companyInfo, payrollPeriod, summary }: PayrollSaveData = body

    // Validasi input
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data karyawan tidak valid atau kosong' },
        { status: 400 }
      )
    }

    if (!payrollPeriod || !payrollPeriod.month || !payrollPeriod.year) {
      return NextResponse.json(
        { success: false, error: 'Periode payroll tidak valid' },
        { status: 400 }
      )
    }

    // Validasi data karyawan
    for (const employee of employees) {
      if (!employee.name || !employee.id) {
        return NextResponse.json(
          { success: false, error: 'Data karyawan tidak lengkap' },
          { status: 400 }
        )
      }
      
      if (typeof employee.netSalary !== 'number' || employee.netSalary < 0) {
        return NextResponse.json(
          { success: false, error: `Gaji bersih tidak valid untuk ${employee.name}` },
          { status: 400 }
        )
      }
    }

    // Cek apakah payroll run sudah ada untuk periode yang sama
    const existingPayrollRun = await prisma!.payrollRun.findFirst({
      where: {
        periodeAwal: payrollPeriod.startDate,
        periodeAkhir: payrollPeriod.endDate,
        deletedAt: null
      }
    })

    if (existingPayrollRun) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payroll run sudah ada untuk periode ini',
          existingRunId: existingPayrollRun.id
        },
        { status: 409 }
      )
    }

    // Mulai transaksi database
    const result = await prisma!.$transaction(async (tx) => {
      // 1. Buat PayrollRun
      const payrollRun = await tx.payrollRun.create({
        data: {
          periodeAwal: payrollPeriod.startDate,
          periodeAkhir: payrollPeriod.endDate,
          status: 'DRAFT',
          createdBy: 'system', // TODO: Get from auth
          notes: `Payroll run untuk ${payrollPeriod.month}/${payrollPeriod.year}`
        }
      })

      // 2. Buat atau update Employee records
      const employeeRecords = []
      for (const empData of employees) {
        // Cek apakah employee sudah ada
        let employee = await tx.employee.findUnique({
          where: { id: empData.id }
        })

        if (!employee) {
          // Buat employee baru jika belum ada
          employee = await tx.employee.create({
            data: {
              id: empData.id,
              nama: empData.name,
              jabatan: empData.position,
              site: 'Default Site', // Default value
              kontrakUpahHarian: empData.basicSalary / empData.workingDays,
              defaultUangMakan: empData.allowances / empData.workingDays,
              defaultUangBbm: 0,
              aktif: true
            }
          })
        }

        employeeRecords.push(employee)
      }

      // 3. Buat PayrollLine untuk setiap employee
      const payrollLines = []
      for (let i = 0; i < employees.length; i++) {
        const empData = employees[i]
        const employee = employeeRecords[i]

        const payrollLine = await tx.payrollLine.create({
          data: {
            payrollRunId: payrollRun.id,
            employeeId: employee.id,
            employeeName: employee.nama,
            hariKerja: empData.workingDays,
            upahHarian: empData.basicSalary / empData.workingDays,
            uangMakanHarian: empData.allowances / empData.workingDays,
            uangBbmHarian: 0,
            overtimeHours: empData.overtimeHours,
            overtimeRate: 1.5,
            cashbon: empData.deductions - (empData.basicSalary + empData.allowances + empData.overtimePay - empData.netSalary),
            bruto: empData.basicSalary + empData.allowances + empData.overtimePay,
            pajakRate: 0.05,
            pajakNominal: (empData.basicSalary + empData.allowances + empData.overtimePay - empData.netSalary) - empData.deductions,
            potonganLain: 0,
            neto: empData.netSalary,
            status: 'DRAFT',
            notes: `Generated from PDF import/export`
          }
        })

        payrollLines.push(payrollLine)

        // 4. Buat PayrollLineComponent untuk setiap komponen
        for (const component of empData.components) {
          // Cek apakah PayComponent sudah ada
          let payComponent = await tx.payComponent.findFirst({
            where: { nama: component.name }
          })

          if (!payComponent) {
            // Buat PayComponent baru
            payComponent = await tx.payComponent.create({
              data: {
                nama: component.name,
                tipe: component.type === 'earning' ? 'EARNING' : 'DEDUCTION',
                taxable: component.type === 'earning',
                metode: 'FLAT',
                basis: 'UPAH_HARIAN',
                nominal: component.amount,
                aktif: true,
                order: 0,
                createdBy: 'system'
              }
            })
          }

          // Buat PayrollLineComponent
          await tx.payrollLineComponent.create({
            data: {
              payrollLineId: payrollLine.id,
              componentId: payComponent.id,
              componentName: payComponent.nama,
              componentType: payComponent.tipe,
              qty: 1,
              rate: component.amount,
              nominal: component.amount,
              amount: component.amount,
              taxable: payComponent.taxable
            }
          })
        }
      }

      return {
        payrollRun,
        payrollLines,
        employeeRecords
      }
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan payroll run dengan ${result.payrollLines.length} karyawan`,
      data: {
        payrollRunId: result.payrollRun.id,
        totalEmployees: result.payrollLines.length,
        totalAmount: summary.totalNeto
      }
    })

  } catch (error) {
    console.error('Error saving payroll data:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menyimpan data payroll',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma!.$disconnect()
    }
  }
}

/**
 * GET /api/payroll/save
 * Mendapatkan daftar payroll runs yang tersimpan
 */
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [payrollRuns, totalCount] = await Promise.all([
      prisma!.payrollRun.findMany({
        where: { deletedAt: null },
        include: {
          payrollLines: {
            include: {
              employee: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma!.payrollRun.count({
        where: { deletedAt: null }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        payrollRuns,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching payroll runs:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data payroll runs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma!.$disconnect()
    }
  }
}
