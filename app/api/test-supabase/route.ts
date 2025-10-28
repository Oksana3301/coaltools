import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/test-supabase
 * Test kompatibilitas dengan Supabase dan validasi data
 */
export async function GET(request: NextRequest) {
  try {
    const testResults = {
      database: {
        connected: false,
        tables: [] as string[],
        errors: [] as string[]
      },
      supabase: {
        compatible: false,
        features: [] as string[],
        errors: [] as string[]
      },
      dataIntegrity: {
        valid: false,
        checks: [] as string[],
        errors: [] as string[]
      }
    }

    // Test 1: Database Connection
    try {
      await prisma.$connect()
      testResults.database.connected = true
      
      // Test basic query
      const userCount = await prisma.user.count()
      testResults.database.tables.push(`Users: ${userCount} records`)
      
      const employeeCount = await prisma.employee.count()
      testResults.database.tables.push(`Employees: ${employeeCount} records`)
      
      const payrollRunCount = await prisma.payrollRun.count()
      testResults.database.tables.push(`Payroll Runs: ${payrollRunCount} records`)
      
    } catch (error) {
      testResults.database.errors.push(error instanceof Error ? error.message : 'Unknown database error')
    }

    // Test 2: Supabase Compatibility
    try {
      // Test if we can use Supabase features
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseKey) {
        testResults.supabase.compatible = true
        testResults.supabase.features.push('Environment variables configured')
        testResults.supabase.features.push('Ready for Supabase integration')
      } else {
        testResults.supabase.errors.push('Supabase environment variables not configured')
      }
    } catch (error) {
      testResults.supabase.errors.push(error instanceof Error ? error.message : 'Supabase test error')
    }

    // Test 3: Data Integrity Checks
    try {
      // Check if database schema is valid
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      ` as Array<{ name: string }>
      
      const expectedTables = ['users', 'employees', 'payroll_runs', 'payroll_lines', 'pay_components']
      const existingTables = tables.map(t => t.name)
      
      for (const expectedTable of expectedTables) {
        if (existingTables.includes(expectedTable)) {
          testResults.dataIntegrity.checks.push(`✓ Table ${expectedTable} exists`)
        } else {
          testResults.dataIntegrity.checks.push(`✗ Table ${expectedTable} missing`)
        }
      }
      
      // Check for data consistency
      const payrollRuns = await prisma.payrollRun.findMany({
        include: { payrollLines: true }
      })
      
      for (const run of payrollRuns) {
        if (run.payrollLines.length === 0) {
          testResults.dataIntegrity.checks.push(`⚠ Payroll Run ${run.id} has no lines`)
        } else {
          testResults.dataIntegrity.checks.push(`✓ Payroll Run ${run.id} has ${run.payrollLines.length} lines`)
        }
      }
      
      testResults.dataIntegrity.valid = testResults.dataIntegrity.checks.every(check => check.startsWith('✓'))
      
    } catch (error) {
      testResults.dataIntegrity.errors.push(error instanceof Error ? error.message : 'Data integrity test error')
    }

    // Overall status
    const overallStatus = testResults.database.connected && 
                         testResults.supabase.compatible && 
                         testResults.dataIntegrity.valid

    return NextResponse.json({
      success: true,
      status: overallStatus ? 'PASS' : 'FAIL',
      message: overallStatus ? 'All tests passed' : 'Some tests failed',
      results: testResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Supabase test error:', error)
    
    return NextResponse.json({
      success: false,
      status: 'ERROR',
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * POST /api/test-supabase
 * Test write operations to Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testData } = body

    if (!testData) {
      return NextResponse.json({
        success: false,
        error: 'Test data required'
      }, { status: 400 })
    }

    // Test write operations
    const testResults = {
      createUser: { success: false, error: null as string | null },
      createEmployee: { success: false, error: null as string | null },
      createPayrollRun: { success: false, error: null as string | null },
      cleanup: { success: false, error: null as string | null }
    }

    let testUserId = ''
    let testEmployeeId = ''
    let testPayrollRunId = ''

    try {
      // Test 1: Create test user
      const testUser = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
          password: 'test123',
          role: 'STAFF'
        }
      })
      testUserId = testUser.id
      testResults.createUser.success = true

      // Test 2: Create test employee
      const testEmployee = await prisma.employee.create({
        data: {
          nama: 'Test Employee',
          jabatan: 'Test Position',
          site: 'Test Site',
          kontrakUpahHarian: 100000,
          aktif: true
        }
      })
      testEmployeeId = testEmployee.id
      testResults.createEmployee.success = true

      // Test 3: Create test payroll run
      const testPayrollRun = await prisma.payrollRun.create({
        data: {
          periodeAwal: '2024-01-01',
          periodeAkhir: '2024-01-31',
          status: 'DRAFT',
          createdBy: testUserId,
          notes: 'Test payroll run'
        }
      })
      testPayrollRunId = testPayrollRun.id
      testResults.createPayrollRun.success = true

      // Test 4: Create payroll line
      await prisma.payrollLine.create({
        data: {
          payrollRunId: testPayrollRunId,
          employeeId: testEmployeeId,
          employeeName: 'Test Employee',
          hariKerja: 26,
          upahHarian: 100000,
          uangMakanHarian: 25000,
          uangBbmHarian: 15000,
          bruto: 2600000,
          pajakNominal: 130000,
          neto: 2470000,
          status: 'DRAFT'
        }
      })

    } catch (error) {
      console.error('Write test error:', error)
      if (error instanceof Error) {
        if (error.message.includes('user')) testResults.createUser.error = error.message
        if (error.message.includes('employee')) testResults.createEmployee.error = error.message
        if (error.message.includes('payroll')) testResults.createPayrollRun.error = error.message
      }
    } finally {
      // Cleanup test data
      try {
        if (testPayrollRunId) {
          await prisma.payrollLine.deleteMany({
            where: { payrollRunId: testPayrollRunId }
          })
          await prisma.payrollRun.delete({
            where: { id: testPayrollRunId }
          })
        }
        if (testEmployeeId) {
          await prisma.employee.delete({
            where: { id: testEmployeeId }
          })
        }
        if (testUserId) {
          await prisma.user.delete({
            where: { id: testUserId }
          })
        }
        testResults.cleanup.success = true
      } catch (error) {
        testResults.cleanup.error = error instanceof Error ? error.message : 'Cleanup failed'
      }
    }

    const allTestsPassed = Object.values(testResults).every(test => test.success)

    return NextResponse.json({
      success: true,
      status: allTestsPassed ? 'PASS' : 'FAIL',
      message: allTestsPassed ? 'All write tests passed' : 'Some write tests failed',
      results: testResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Supabase write test error:', error)
    
    return NextResponse.json({
      success: false,
      status: 'ERROR',
      message: 'Write test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
