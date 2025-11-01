import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


// Use shared prisma client from lib/db


interface TestResult {
  module: string
  operation: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
  timestamp: string
}

// Generate test data
const generateTestData = () => {
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
  return {
    employee: {
      nama: `Test Employee ${Date.now()}`,
      nik: `TEST${Date.now()}`,
      jabatan: 'Test Position',
      site: 'Test Site',
      kontrakUpahHarian: 150000,
      defaultUangMakan: 25000,
      defaultUangBbm: 30000,
      aktif: true
    },
    kasKecil: {
      hari: 'Senin',
      tanggal: timestamp.split(' ')[0],
      bulan: 'Januari',
      tipeAktivitas: 'Operasional',
      barang: 'Test Item',
      banyak: 1,
      satuan: 'pcs',
      hargaSatuan: 50000,
      total: 50000,
      vendorNama: 'Test Vendor',
      jenis: 'kas_kecil',
      subJenis: 'consumables',
      status: 'DRAFT' as const,
      createdBy: 'test-user-id'
    },
    kasBesar: {
      hari: 'Senin',
      tanggal: timestamp.split(' ')[0],
      bulan: 'Januari',
      tipeAktivitas: 'Investasi',
      barang: 'Test Equipment',
      banyak: 1,
      satuan: 'unit',
      hargaSatuan: 5000000,
      total: 5000000,
      vendorNama: 'Test Supplier',
      jenis: 'kas_besar',
      subJenis: 'equipment',
      status: 'DRAFT' as const,
      createdBy: 'test-user-id'
    },
    buyer: {
      nama: `Test Buyer ${Date.now()}`,
      hargaPerTonDefault: 850000,
      alamat: 'Test Address',
      telepon: '08123456789',
      email: 'test@buyer.com',
      aktif: true
    },
    productionReport: {
      tanggal: timestamp.split(' ')[0],
      nopol: `TEST${Date.now()}`,
      pembeliNama: 'Test Buyer',
      tujuan: 'Test Destination',
      grossTon: 25.5,
      tareTon: 8.5,
      nettoTon: 17.0,
      status: 'DRAFT' as const,
      createdBy: 'test-user-id'
    },
    payComponent: {
      nama: `Test Component ${Date.now()}`,
      tipe: 'EARNING' as const,
      metode: 'FLAT' as const,
      basis: 'UPAH_HARIAN' as const,
      nominal: 50000,
      order: 999,
      aktif: true
    }
  }
}

// Test functions
async function testEmployeesCRUD(prisma: any): Promise<TestResult[]> {
  const results: TestResult[] = []
  const testData = generateTestData()
  let createdId: string | null = null

  try {
    // CREATE Test
    const created = await prisma!.employee.create({
      data: {
        nama: testData.employee.nama,
        nik: testData.employee.nik,
        jabatan: testData.employee.jabatan,
        site: testData.employee.site,
        kontrakUpahHarian: testData.employee.kontrakUpahHarian,
        defaultUangMakan: testData.employee.defaultUangMakan,
        defaultUangBbm: testData.employee.defaultUangBbm,
        aktif: testData.employee.aktif
      }
    })
    createdId = created.id
    results.push({
      module: 'Employees',
      operation: 'CREATE',
      status: 'success',
      message: 'Employee created successfully',
      details: { id: created.id, nama: created.nama },
      timestamp: new Date().toISOString()
    })

    // READ Test
    const found = await prisma!.employee.findUnique({
      where: { id: createdId }
    })
    results.push({
      module: 'Employees',
      operation: 'READ',
      status: found ? 'success' : 'error',
      message: found ? 'Employee found successfully' : 'Employee not found',
      details: found ? { id: found.id } : null,
      timestamp: new Date().toISOString()
    })

    // UPDATE Test
    const updated = await prisma!.employee.update({
      where: { id: createdId },
      data: { jabatan: 'Updated Test Position' }
    })
    results.push({
      module: 'Employees',
      operation: 'UPDATE',
      status: 'success',
      message: 'Employee updated successfully',
      details: { id: updated.id, jabatan: updated.jabatan },
      timestamp: new Date().toISOString()
    })

    // DELETE Test
    await prisma!.employee.delete({
      where: { id: createdId }
    })
    results.push({
      module: 'Employees',
      operation: 'DELETE',
      status: 'success',
      message: 'Employee deleted successfully',
      details: { id: createdId },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    results.push({
      module: 'Employees',
      operation: 'CRUD_ERROR',
      status: 'error',
      message: error.message || 'Unknown error occurred',
      details: error,
      timestamp: new Date().toISOString()
    })

    // Cleanup if needed
    if (createdId) {
      try {
        await prisma!.employee.delete({ where: { id: createdId } })
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  return results
}

async function testKasKecilCRUD(prisma: any): Promise<TestResult[]> {
  const results: TestResult[] = []
  const testData = generateTestData()
  let createdId: string | null = null

  try {
    // CREATE Test
    const created = await prisma!.kasKecilExpense.create({
      data: testData.kasKecil
    })
    createdId = created.id
    results.push({
      module: 'Kas Kecil',
      operation: 'CREATE',
      status: 'success',
      message: 'Kas Kecil expense created successfully',
      details: { id: created.id, barang: created.barang },
      timestamp: new Date().toISOString()
    })

    // READ Test
    const found = await prisma!.kasKecilExpense.findUnique({
      where: { id: createdId }
    })
    results.push({
      module: 'Kas Kecil',
      operation: 'READ',
      status: found ? 'success' : 'error',
      message: found ? 'Kas Kecil expense found successfully' : 'Kas Kecil expense not found',
      details: found ? { id: found.id } : null,
      timestamp: new Date().toISOString()
    })

    // UPDATE Test
    const updated = await prisma!.kasKecilExpense.update({
      where: { id: createdId },
      data: { status: 'SUBMITTED' }
    })
    results.push({
      module: 'Kas Kecil',
      operation: 'UPDATE',
      status: 'success',
      message: 'Kas Kecil expense updated successfully',
      details: { id: updated.id, status: updated.status },
      timestamp: new Date().toISOString()
    })

    // DELETE Test
    await prisma!.kasKecilExpense.update({
      where: { id: createdId },
      data: { deletedAt: new Date() }
    })
    results.push({
      module: 'Kas Kecil',
      operation: 'DELETE',
      status: 'success',
      message: 'Kas Kecil expense soft deleted successfully',
      details: { id: createdId },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    results.push({
      module: 'Kas Kecil',
      operation: 'CRUD_ERROR',
      status: 'error',
      message: error.message || 'Unknown error occurred',
      details: error,
      timestamp: new Date().toISOString()
    })
  }

  return results
}

async function testKasBesarCRUD(prisma: any): Promise<TestResult[]> {
  const results: TestResult[] = []
  const testData = generateTestData()
  let createdId: string | null = null

  try {
    // CREATE Test
    const created = await prisma!.kasBesarExpense.create({
      data: testData.kasBesar
    })
    createdId = created.id
    results.push({
      module: 'Kas Besar',
      operation: 'CREATE',
      status: 'success',
      message: 'Kas Besar expense created successfully',
      details: { id: created.id, barang: created.barang },
      timestamp: new Date().toISOString()
    })

    // READ Test
    const found = await prisma!.kasBesarExpense.findUnique({
      where: { id: createdId }
    })
    results.push({
      module: 'Kas Besar',
      operation: 'READ',
      status: found ? 'success' : 'error',
      message: found ? 'Kas Besar expense found successfully' : 'Kas Besar expense not found',
      details: found ? { id: found.id } : null,
      timestamp: new Date().toISOString()
    })

    // UPDATE Test
    const updated = await prisma!.kasBesarExpense.update({
      where: { id: createdId },
      data: { status: 'SUBMITTED' }
    })
    results.push({
      module: 'Kas Besar',
      operation: 'UPDATE',
      status: 'success',
      message: 'Kas Besar expense updated successfully',
      details: { id: updated.id, status: updated.status },
      timestamp: new Date().toISOString()
    })

    // DELETE Test
    await prisma!.kasBesarExpense.update({
      where: { id: createdId },
      data: { deletedAt: new Date() }
    })
    results.push({
      module: 'Kas Besar',
      operation: 'DELETE',
      status: 'success',
      message: 'Kas Besar expense soft deleted successfully',
      details: { id: createdId },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    results.push({
      module: 'Kas Besar',
      operation: 'CRUD_ERROR',
      status: 'error',
      message: error.message || 'Unknown error occurred',
      details: error,
      timestamp: new Date().toISOString()
    })
  }

  return results
}

async function testBuyersCRUD(prisma: any): Promise<TestResult[]> {
  const results: TestResult[] = []
  const testData = generateTestData()
  let createdId: string | null = null

  try {
    // CREATE Test
    const created = await prisma!.buyer.create({
      data: testData.buyer
    })
    createdId = created.id
    results.push({
      module: 'Buyers',
      operation: 'CREATE',
      status: 'success',
      message: 'Buyer created successfully',
      details: { id: created.id, nama: created.nama },
      timestamp: new Date().toISOString()
    })

    // READ Test
    const found = await prisma!.buyer.findUnique({
      where: { id: createdId }
    })
    results.push({
      module: 'Buyers',
      operation: 'READ',
      status: found ? 'success' : 'error',
      message: found ? 'Buyer found successfully' : 'Buyer not found',
      details: found ? { id: found.id } : null,
      timestamp: new Date().toISOString()
    })

    // UPDATE Test
    const updated = await prisma!.buyer.update({
      where: { id: createdId },
      data: { hargaPerTonDefault: 900000 }
    })
    results.push({
      module: 'Buyers',
      operation: 'UPDATE',
      status: 'success',
      message: 'Buyer updated successfully',
      details: { id: updated.id, hargaPerTonDefault: updated.hargaPerTonDefault },
      timestamp: new Date().toISOString()
    })

    // DELETE Test
    await prisma!.buyer.delete({
      where: { id: createdId }
    })
    results.push({
      module: 'Buyers',
      operation: 'DELETE',
      status: 'success',
      message: 'Buyer deleted successfully',
      details: { id: createdId },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    results.push({
      module: 'Buyers',
      operation: 'CRUD_ERROR',
      status: 'error',
      message: error.message || 'Unknown error occurred',
      details: error,
      timestamp: new Date().toISOString()
    })

    // Cleanup if needed
    if (createdId) {
      try {
        await prisma!.buyer.delete({ where: { id: createdId } })
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  return results
}


async function testPayComponentsCRUD(prisma: any): Promise<TestResult[]> {
  const results: TestResult[] = []
  const testData = generateTestData()
  let createdId: string | null = null

  try {
    // CREATE Test
    const created = await prisma!.payComponent.create({
      data: {
        nama: testData.payComponent.nama,
        tipe: testData.payComponent.tipe,
        metode: testData.payComponent.metode,
        basis: testData.payComponent.basis,
        nominal: testData.payComponent.nominal,
        order: testData.payComponent.order,
        aktif: testData.payComponent.aktif
      }
    })
    createdId = created.id
    results.push({
      module: 'Pay Components',
      operation: 'CREATE',
      status: 'success',
      message: 'Pay component created successfully',
      details: { id: created.id, nama: created.nama },
      timestamp: new Date().toISOString()
    })

    // READ Test
    const found = await prisma!.payComponent.findUnique({
      where: { id: createdId }
    })
    results.push({
      module: 'Pay Components',
      operation: 'READ',
      status: found ? 'success' : 'error',
      message: found ? 'Pay component found successfully' : 'Pay component not found',
      details: found ? { id: found.id } : null,
      timestamp: new Date().toISOString()
    })

    // UPDATE Test
    const updated = await prisma!.payComponent.update({
      where: { id: createdId },
      data: { nominal: 75000 }
    })
    results.push({
      module: 'Pay Components',
      operation: 'UPDATE',
      status: 'success',
      message: 'Pay component updated successfully',
      details: { id: updated.id, nominal: updated.nominal },
      timestamp: new Date().toISOString()
    })

    // DELETE Test
    await prisma!.payComponent.delete({
      where: { id: createdId }
    })
    results.push({
      module: 'Pay Components',
      operation: 'DELETE',
      status: 'success',
      message: 'Pay component deleted successfully',
      details: { id: createdId },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    results.push({
      module: 'Pay Components',
      operation: 'CRUD_ERROR',
      status: 'error',
      message: error.message || 'Unknown error occurred',
      details: error,
      timestamp: new Date().toISOString()
    })

    // Cleanup if needed
    if (createdId) {
      try {
        await prisma!.payComponent.delete({ where: { id: createdId } })
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  return results
}

async function testPayrollCRUD(prisma: any): Promise<TestResult[]> {
  const results: TestResult[] = []
  let createdPayrollId: string | null = null
  let createdUserId: string | null = null
  let createdEmployeeIds: string[] = []

  try {
    // First create a test user for the foreign key constraint
    const testUser = await prisma!.user.create({
      data: {
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'test123',
        role: 'STAFF'
      }
    })
    createdUserId = testUser.id

    // Create test employees (required for payroll)
    const testData = generateTestData()
    for (let i = 0; i < 2; i++) {
      const employee = await prisma!.employee.create({
        data: {
          nama: `${testData.employee.nama} ${i + 1}`,
          nik: `${testData.employee.nik}${i}`,
          jabatan: testData.employee.jabatan,
          site: testData.employee.site,
          kontrakUpahHarian: testData.employee.kontrakUpahHarian,
          defaultUangMakan: testData.employee.defaultUangMakan,
          defaultUangBbm: testData.employee.defaultUangBbm,
          aktif: true // Make sure they are active
        }
      })
      createdEmployeeIds.push(employee.id)
    }

    // CREATE Payroll Test
    // First check that we have active employees
    const activeEmployees = await prisma!.employee.findMany({
      where: { aktif: true }
    })

    if (activeEmployees.length === 0) {
      throw new Error('No active employees found for payroll creation')
    }

    // Create payroll run directly
    const createdPayroll = await prisma!.payrollRun.create({
      data: {
        periodeAwal: '2025-01-01',
        periodeAkhir: '2025-01-31',
        status: 'DRAFT',
        createdBy: createdUserId
      }
    })
    createdPayrollId = createdPayroll.id
    
    results.push({
      module: 'Payroll',
      operation: 'CREATE',
      status: 'success',
      message: 'Payroll run created successfully',
      details: { id: createdPayroll.id, periode: `${createdPayroll.periodeAwal} - ${createdPayroll.periodeAkhir}` },
      timestamp: new Date().toISOString()
    })

    // READ Payroll Test
    const foundPayroll = await prisma!.payrollRun.findUnique({
      where: { id: createdPayrollId }
    })
    results.push({
      module: 'Payroll',
      operation: 'READ',
      status: foundPayroll ? 'success' : 'error',
      message: foundPayroll ? 'Payroll run found successfully' : 'Payroll run not found',
      details: foundPayroll ? { id: foundPayroll.id } : null,
      timestamp: new Date().toISOString()
    })

    // UPDATE Payroll Test
    const updatedPayroll = await prisma!.payrollRun.update({
      where: { id: createdPayrollId },
      data: { status: 'SUBMITTED' }
    })
    results.push({
      module: 'Payroll',
      operation: 'UPDATE',
      status: 'success',
      message: 'Payroll run updated successfully',
      details: { id: updatedPayroll.id, status: updatedPayroll.status },
      timestamp: new Date().toISOString()
    })

    // DELETE Payroll Test
    await prisma!.payrollRun.delete({
      where: { id: createdPayrollId }
    })
    results.push({
      module: 'Payroll',
      operation: 'DELETE',
      status: 'success',
      message: 'Payroll run deleted successfully',
      details: { id: createdPayrollId },
      timestamp: new Date().toISOString()
    })

    // Clean up test employees after successful test
    for (const employeeId of createdEmployeeIds) {
      try {
        await prisma!.employee.delete({
          where: { id: employeeId }
        })
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    // Clean up test user after successful test
    if (createdUserId) {
      try {
        await prisma!.user.delete({
          where: { id: createdUserId }
        })
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

  } catch (error: any) {
    results.push({
      module: 'Payroll',
      operation: 'CRUD_ERROR',
      status: 'error',
      message: error.message || 'Unknown error occurred',
      details: error,
      timestamp: new Date().toISOString()
    })

    // Cleanup if needed
    if (createdPayrollId) {
      try {
        await prisma!.payrollRun.delete({ where: { id: createdPayrollId } })
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    // Clean up test employees on error
    for (const employeeId of createdEmployeeIds) {
      try {
        await prisma!.employee.delete({ where: { id: employeeId } })
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    // Clean up test user on error
    if (createdUserId) {
      try {
        await prisma!.user.delete({ where: { id: createdUserId } })
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  // Cleanup test user
  if (createdUserId) {
    try {
      await prisma!.user.delete({ where: { id: createdUserId } })
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }

  return results
}

export async function POST(request: NextRequest) {
  try {
  // Check if prisma client is available
  if (!prisma) {
  return NextResponse.json(
  { success: false, error: 'Database connection not available' },
  { status: 503 }
  )
  }

    const { testType } = await request.json()
    // prisma already initialized above

    let results: TestResult[] = []

    switch (testType) {
      case 'employees':
        results = await testEmployeesCRUD(prisma)
        break
      case 'kas-kecil':
        results = await testKasKecilCRUD(prisma)
        break
      case 'kas-besar':
        results = await testKasBesarCRUD(prisma)
        break
      case 'buyers':
        results = await testBuyersCRUD(prisma)
        break
      case 'pay-components':
        results = await testPayComponentsCRUD(prisma)
        break
      case 'payroll':
        results = await testPayrollCRUD(prisma)
        break
      case 'all':
        const allTests = await Promise.all([
          testKasKecilCRUD(prisma),
          testKasBesarCRUD(prisma),
          testBuyersCRUD(prisma)
        ])
        // Add problematic modules with error handling
        try {
          const employeeTests = await testEmployeesCRUD(prisma)
          allTests.push(employeeTests)
        } catch (error) {
          allTests.push([{
            module: 'Employees',
            operation: 'SCHEMA_ERROR',
            status: 'error' as const,
            message: 'Table schema mismatch - run Supabase SQL script to fix',
            timestamp: new Date().toISOString()
          }])
        }
        
        try {
          const payComponentTests = await testPayComponentsCRUD(prisma)
          allTests.push(payComponentTests)
        } catch (error) {
          allTests.push([{
            module: 'Pay Components',
            operation: 'SCHEMA_ERROR',
            status: 'error' as const,
            message: 'Table schema mismatch - run Supabase SQL script to fix',
            timestamp: new Date().toISOString()
          }])
        }
        
        try {
          const payrollTests = await testPayrollCRUD(prisma)
          allTests.push(payrollTests)
        } catch (error) {
          allTests.push([{
            module: 'Payroll',
            operation: 'SCHEMA_ERROR',
            status: 'error' as const,
            message: 'Payroll test failed - check payroll schema and dependencies',
            timestamp: new Date().toISOString()
          }])
        }
        
        results = allTests.flat()
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        error: results.filter(r => r.status === 'error').length,
        warning: results.filter(r => r.status === 'warning').length
      }
    })

  } catch (error: any) {
    console.error('Error running admin tests:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Admin test endpoint',
    availableTests: [
      'employees',
      'kas-kecil', 
      'kas-besar',
      'buyers',
      'pay-components',
      'all'
    ]
  })
}
