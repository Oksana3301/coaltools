"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Eye, Trash2, RefreshCw } from "lucide-react"

interface TestResult {
  test: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
}

export default function AdminStatusTestPage() {
  const { toast } = useToast()
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateResult = (test: string, status: TestResult['status'], message?: string) => {
    setResults(prev => {
      const existingIndex = prev.findIndex(r => r.test === test)
      const newResult = { test, status, message }
      
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = newResult
        return updated
      } else {
        return [...prev, newResult]
      }
    })
  }

  const testStatusUpdate = async (
    endpoint: string,
    method: string,
    data: any,
    testName: string
  ) => {
    updateResult(testName, 'running')
    
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success || response.ok) {
        updateResult(testName, 'success', `✅ ${result.message || 'Status updated successfully'}`)
        return result
      } else {
        updateResult(testName, 'error', `❌ ${result.error || 'Failed to update status'}`)
        return null
      }
    } catch (error: any) {
      updateResult(testName, 'error', `❌ Network error: ${error.message}`)
      return null
    }
  }

  const testDeleteOperations = async (adminUserId: string) => {
    // Test 1: Kas Kecil Delete Operations
    console.log('5.1. Testing Kas Kecil Delete Operations...')
    const kasKecilTestData = {
      hari: 'Monday',
      tanggal: '2025-08-27',
      bulan: 'Agustus 2025',
      tipeAktivitas: 'Operasional',
      barang: 'Test Item for Delete',
      banyak: 1,
      satuan: 'unit',
      hargaSatuan: 25000,
      total: 25000,
      vendorNama: 'Test Vendor Delete',
      jenis: 'kas_kecil',
      subJenis: 'operasional',
      status: 'DRAFT',
      createdBy: adminUserId
    }
    
    const kasKecilForDelete = await testStatusUpdate('/kas-kecil', 'POST', kasKecilTestData, 'Create Kas Kecil for Delete Test')
    
    if (kasKecilForDelete?.success) {
      const kasKecilId = kasKecilForDelete.data.id
      
      // Test soft delete
      await testStatusUpdate(`/kas-kecil/${kasKecilId}?hardDelete=false`, 'DELETE', {}, 'Kas Kecil: Soft Delete')
      
      // Test hard delete (create another item)
      const kasKecilForHardDelete = await testStatusUpdate('/kas-kecil', 'POST', kasKecilTestData, 'Create Kas Kecil for Hard Delete')
      if (kasKecilForHardDelete?.success) {
        await testStatusUpdate(`/kas-kecil/${kasKecilForHardDelete.data.id}?hardDelete=true`, 'DELETE', {}, 'Kas Kecil: Hard Delete')
      }
    }

    // Test 2: Kas Besar Delete Operations
    console.log('5.2. Testing Kas Besar Delete Operations...')
    const kasBesarTestData = {
      hari: 'Monday',
      tanggal: '2025-08-27',
      bulan: 'Agustus 2025',
      tipeAktivitas: 'Investasi',
      barang: 'Test Equipment for Delete',
      banyak: 1,
      satuan: 'unit',
      hargaSatuan: 1000000,
      total: 1000000,
      vendorNama: 'Test Vendor Besar Delete',
      jenis: 'kas_besar',
      subJenis: 'investasi',
      status: 'DRAFT',
      createdBy: adminUserId
    }
    
    const kasBesarForDelete = await testStatusUpdate('/kas-besar', 'POST', kasBesarTestData, 'Create Kas Besar for Delete Test')
    
    if (kasBesarForDelete?.success) {
      const kasBesarId = kasBesarForDelete.data.id
      
      // Test delete with userId (kas besar requires userId)
      await testStatusUpdate(`/kas-besar?id=${kasBesarId}&userId=${adminUserId}`, 'DELETE', {}, 'Kas Besar: Delete')
    }

    // Test 3: Payroll Delete Operations
    console.log('5.3. Testing Payroll Delete Operations...')
    const payrollTestData = {
      periodeAwal: '2025-08-15',
      periodeAkhir: '2025-08-31',
      createdBy: adminUserId,
      employeeOverrides: []
    }
    
    const payrollForDelete = await testStatusUpdate('/payroll', 'POST', payrollTestData, 'Create Payroll for Delete Test')
    
    if (payrollForDelete?.success) {
      const payrollId = payrollForDelete.data.id
      
      // Test soft delete
      await testStatusUpdate(`/payroll?id=${payrollId}&force=false`, 'DELETE', {}, 'Payroll: Soft Delete')
      
      // Test hard delete (only works for DRAFT status)
      const payrollForHardDelete = await testStatusUpdate('/payroll', 'POST', payrollTestData, 'Create Payroll for Hard Delete')
      if (payrollForHardDelete?.success) {
        await testStatusUpdate(`/payroll?id=${payrollForHardDelete.data.id}&force=true`, 'DELETE', {}, 'Payroll: Hard Delete (DRAFT only)')
      }
    }

    // Test 4: Employee Delete Operations (if any exist)
    console.log('5.4. Testing Employee Delete Operations...')
    try {
      const employeesResponse = await fetch(`/api/employees?limit=1`)
      const employees = await employeesResponse.json()
      
      if (employees.success && employees.data && employees.data.length > 0) {
        const employeeId = employees.data[0].id
        console.log('✅ Found existing employee:', employeeId)
        
        // Test soft delete (deactivation)
        await testStatusUpdate(`/employees/${employeeId}?hardDelete=false`, 'DELETE', {}, 'Employee: Soft Delete (Deactivate)')
      } else {
        updateResult('Employee: Delete Test', 'pending', 'ℹ️  No employees found to test delete operations')
      }
    } catch (error: any) {
      updateResult('Employee: Delete Test', 'error', `❌ Employee delete test failed: ${error.message}`)
    }

    // Test 5: Production Report Delete Operations (if any exist)
    console.log('5.5. Testing Production Report Delete Operations...')
    try {
      const reportsResponse = await fetch(`/api/production-reports?limit=1`)
      const reports = await reportsResponse.json()
      
      if (reports.success && reports.data && reports.data.length > 0) {
        const reportId = reports.data[0].id
        console.log('✅ Found existing production report:', reportId)
        
        // Test soft delete
        await testStatusUpdate(`/production-reports/${reportId}?hardDelete=false`, 'DELETE', {}, 'Production Report: Soft Delete')
      } else {
        updateResult('Production Report: Delete Test', 'pending', 'ℹ️  No production reports found to test delete operations')
      }
    } catch (error: any) {
      updateResult('Production Report: Delete Test', 'error', `❌ Production report delete test failed: ${error.message}`)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])
    const adminUserId = "cmemokbd20000ols63e1xr3f6" // Admin user ID
    
    try {
      // Test 1: Create and test Kas Kecil
      const kasKecilData = {
        hari: 'Monday',
        tanggal: '2025-08-27',
        bulan: 'Agustus 2025',
        tipeAktivitas: 'Operasional',
        barang: 'Test Item for Status Test',
        banyak: 1,
        satuan: 'unit',
        hargaSatuan: 50000,
        total: 50000,
        vendorNama: 'Test Vendor Status',
        jenis: 'kas_kecil',
        subJenis: 'operasional',
        status: 'DRAFT',
        createdBy: adminUserId
      }
      
      const kasKecilCreated = await testStatusUpdate('/kas-kecil', 'POST', kasKecilData, 'Create Kas Kecil')
      
      if (kasKecilCreated?.success) {
        const kasKecilId = kasKecilCreated.data.id
        
        // Test status updates through the API (simulating what the frontend does)
        const kasKecilFullData = { ...kasKecilData, id: kasKecilId, status: 'SUBMITTED' }
        await testStatusUpdate(`/kas-kecil/${kasKecilId}`, 'PUT', kasKecilFullData, 'Kas Kecil: DRAFT → SUBMITTED')
        
        kasKecilFullData.status = 'REVIEWED'
        await testStatusUpdate(`/kas-kecil/${kasKecilId}`, 'PUT', kasKecilFullData, 'Kas Kecil: SUBMITTED → REVIEWED')
        
        kasKecilFullData.status = 'APPROVED'
        await testStatusUpdate(`/kas-kecil/${kasKecilId}`, 'PUT', kasKecilFullData, 'Kas Kecil: REVIEWED → APPROVED')
      }

      // Test 2: Create and test Kas Besar
      const kasBesarData = {
        hari: 'Monday',
        tanggal: '2025-08-27',
        bulan: 'Agustus 2025',
        tipeAktivitas: 'Investasi',
        barang: 'Test Equipment for Status',
        banyak: 1,
        satuan: 'unit',
        hargaSatuan: 2000000,
        total: 2000000,
        vendorNama: 'Test Vendor Besar Status',
        jenis: 'kas_besar',
        subJenis: 'investasi',
        status: 'DRAFT',
        createdBy: adminUserId
      }
      
      const kasBesarCreated = await testStatusUpdate('/kas-besar', 'POST', kasBesarData, 'Create Kas Besar')
      
      if (kasBesarCreated?.success) {
        const kasBesarId = kasBesarCreated.data.id
        
        // Test status updates using PATCH endpoint
        await testStatusUpdate(`/kas-besar/${kasBesarId}`, 'PATCH', 
          { status: 'SUBMITTED', approvedBy: adminUserId }, 'Kas Besar: DRAFT → SUBMITTED')
        
        await testStatusUpdate(`/kas-besar/${kasBesarId}`, 'PATCH', 
          { status: 'REVIEWED', approvedBy: adminUserId }, 'Kas Besar: SUBMITTED → REVIEWED')
        
        await testStatusUpdate(`/kas-besar/${kasBesarId}`, 'PATCH', 
          { status: 'APPROVED', approvedBy: adminUserId }, 'Kas Besar: REVIEWED → APPROVED')
      }

      // Test 3: Create and test Payroll
      const payrollData = {
        periodeAwal: '2025-08-01',
        periodeAkhir: '2025-08-31',
        createdBy: adminUserId,
        employeeOverrides: []
      }
      
      const payrollCreated = await testStatusUpdate('/payroll', 'POST', payrollData, 'Create Payroll')
      
      if (payrollCreated?.success) {
        const payrollId = payrollCreated.data.id
        
        await testStatusUpdate(`/payroll/${payrollId}`, 'PATCH', 
          { status: 'REVIEWED', approvedBy: adminUserId }, 'Payroll: DRAFT → REVIEWED')
        
        await testStatusUpdate(`/payroll/${payrollId}`, 'PATCH', 
          { status: 'APPROVED', approvedBy: adminUserId }, 'Payroll: REVIEWED → APPROVED (+ Auto Kwitansi)')
      }

      // Test 4: Test Delete Operations
      console.log('')
      console.log('4. Testing Delete Operations...')
      await testDeleteOperations(adminUserId)

      toast({
        title: "Testing Complete",
        description: "All status and delete button tests have been executed. Check results below.",
      })
      
    } catch (error: any) {
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'outline',
      success: 'default',
      error: 'destructive'
    } as const
    
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Status & Delete Button Test</h1>
          <p className="text-muted-foreground">
            Test all status change and delete buttons to ensure they work properly for admin users
          </p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="min-w-[120px]"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Run Tests
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Click "Run Tests" to start testing status and delete button functionality
            </p>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{result.test}</span>
                    {result.message && (
                      <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    )}
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Change Flow Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Kas Kecil (Expense Management):</h4>
            <p className="text-sm text-muted-foreground">DRAFT → SUBMITTED → REVIEWED → APPROVED</p>
            <p className="text-sm text-blue-600">Delete: Soft Delete (sets deletedAt) | Hard Delete (permanent removal)</p>
          </div>
          <div>
            <h4 className="font-semibold">Kas Besar (Large Expense Management):</h4>
            <p className="text-sm text-muted-foreground">DRAFT → SUBMITTED → REVIEWED → APPROVED</p>
            <p className="text-sm text-blue-600">Delete: Hard Delete only (requires userId and creator/admin permission)</p>
          </div>
          <div>
            <h4 className="font-semibold">Payroll:</h4>
            <p className="text-sm text-muted-foreground">DRAFT → REVIEWED → APPROVED (Auto-generates Kwitansi)</p>
            <p className="text-sm text-blue-600">Delete: Soft Delete (sets deletedAt) | Hard Delete (DRAFT status only)</p>
          </div>
          <div>
            <h4 className="font-semibold">Production Reports:</h4>
            <p className="text-sm text-muted-foreground">DRAFT → SUBMITTED → REVIEWED → APPROVED</p>
            <p className="text-sm text-blue-600">Delete: Soft Delete (sets deletedAt) | Hard Delete (permanent removal)</p>
          </div>
          <div>
            <h4 className="font-semibold">Employees:</h4>
            <p className="text-sm text-muted-foreground">Active/Inactive status</p>
            <p className="text-sm text-blue-600">Delete: Soft Delete (sets aktif=false) | Hard Delete (permanent removal)</p>
          </div>
          <div>
            <h4 className="font-semibold">Kwitansi:</h4>
            <p className="text-sm text-muted-foreground">Auto-generated from approved payroll</p>
            <p className="text-sm text-blue-600">Delete: Soft Delete (sets deletedAt) | Hard Delete (permanent removal)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
