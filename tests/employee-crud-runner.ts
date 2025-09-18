/**
 * Employee CRUD Testing Runner
 * 
 * Script untuk menjalankan testing end-to-end operasi CRUD karyawan
 * Dapat dijalankan dengan: npx tsx tests/employee-crud-runner.ts
 * 
 * Testing mencakup:
 * 1. Create - Membuat karyawan baru dengan validasi lengkap
 * 2. Read - Membaca data karyawan dengan filter dan pencarian
 * 3. Update - Memperbarui data karyawan dengan validasi
 * 4. Delete - Soft delete dan hard delete untuk data testing
 */

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

// Test data - menggunakan timestamp untuk memastikan uniqueness
const timestamp = Date.now();
const validEmployeeData = {
  nama: `Test Employee CRUD Runner ${timestamp}`,
  nik: `TESTCRUD${timestamp}`.slice(0, 16),
  jabatan: 'Operator',
  site: 'Site A',
  kontrakUpahHarian: 150000,
  defaultUangMakan: 25000,
  defaultUangBbm: 15000,
  bank: 'BCA',
  noRekening: `${timestamp}`.slice(-10),
  tanggalMulai: new Date().toISOString(),
  aktif: true
}

const invalidEmployeeData = {
  nama: '', // Invalid: nama kosong
  nik: 'INV', // Invalid: NIK terlalu pendek
  jabatan: '', // Invalid: jabatan kosong
  site: '', // Invalid: site kosong
  kontrakUpahHarian: -1000, // Invalid: upah negatif
  defaultUangMakan: 'invalid', // Invalid: bukan angka
  defaultUangBbm: null, // Invalid: null
  bank: '',
  noRekening: '',
  tanggalMulai: 'invalid-date', // Invalid: format tanggal salah
  aktif: 'not-boolean' // Invalid: bukan boolean
}

// Test results tracking
interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration: number
}

const testResults: TestResult[] = []
let createdEmployeeIds: string[] = []

// Helper functions
function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration: number) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${emoji} ${name} (${duration}ms)${message ? ` - ${message}` : ''}`)
  testResults.push({ name, status, message, duration })
}

async function makeRequest(method: string, endpoint: string, body?: any): Promise<any> {
  const url = `${API_BASE}${endpoint}`
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const data = await response.json()
  
  return {
    status: response.status,
    data,
    ok: response.ok
  }
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now()
  try {
    await testFn()
    const duration = Date.now() - startTime
    logTest(name, 'PASS', '', duration)
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : String(error)
    logTest(name, 'FAIL', message, duration)
  }
}

// Test functions
async function testCreateValidEmployee(): Promise<void> {
  const response = await makeRequest('POST', '/employees', validEmployeeData)
  
  if (response.status !== 201) {
    throw new Error(`Expected status 201, got ${response.status}`)
  }
  
  if (!response.data.success) {
    throw new Error(`Expected success true, got ${response.data.success}`)
  }
  
  if (!response.data.data?.id) {
    throw new Error('Expected employee ID in response')
  }
  
  // Store created employee ID for cleanup
  createdEmployeeIds.push(response.data.data.id)
  
  console.log(`   📝 Created employee ID: ${response.data.data.id}`)
}

async function testCreateInvalidEmployee(): Promise<void> {
  const response = await makeRequest('POST', '/employees', invalidEmployeeData)
  
  if (response.status !== 400) {
    throw new Error(`Expected status 400, got ${response.status}`)
  }
  
  if (response.data.success !== false) {
    throw new Error('Expected validation to fail')
  }
}

async function testCreateDuplicateNIK(): Promise<void> {
  const duplicateData = {
    ...validEmployeeData,
    nama: `Test Duplicate NIK ${timestamp}`,
    nik: validEmployeeData.nik, // Same NIK
    noRekening: `${timestamp + 1}`.slice(-10)
  }
  
  const response = await makeRequest('POST', '/employees', duplicateData)
  
  if (response.status !== 409) {
    throw new Error(`Expected status 409, got ${response.status}`)
  }
  
  if (response.data.success !== false) {
    throw new Error('Expected duplicate NIK validation to fail')
  }
}

async function testGetAllEmployees(): Promise<void> {
  const response = await makeRequest('GET', '/employees')
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`)
  }
  
  if (!response.data.success) {
    throw new Error('Expected success true')
  }
  
  if (!Array.isArray(response.data.data)) {
    throw new Error('Expected data to be array')
  }
  
  console.log(`   📊 Found ${response.data.data.length} employees`)
}

async function testSearchEmployee(): Promise<void> {
  const searchTerm = encodeURIComponent('Test Employee CRUD')
  const response = await makeRequest('GET', `/employees?search=${searchTerm}`)
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`)
  }
  
  if (!response.data.success) {
    throw new Error('Expected success true')
  }
  
  if (response.data.data.length === 0) {
    throw new Error('Expected to find at least one employee')
  }
  
  console.log(`   🔍 Search found ${response.data.data.length} employees`)
}

async function testUpdateEmployee(): Promise<void> {
  if (createdEmployeeIds.length === 0) {
    throw new Error('No employee ID available for update test')
  }
  
  const employeeId = createdEmployeeIds[0]
  const updateData = {
    id: employeeId,
    nama: `Test Employee CRUD Updated ${timestamp}`,
    jabatan: 'Supervisor',
    kontrakUpahHarian: 200000
  }
  
  const response = await makeRequest('PUT', '/employees', updateData)
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`)
  }
  
  if (!response.data.success) {
    throw new Error('Expected success true')
  }
  
  if (response.data.data.nama !== updateData.nama) {
    throw new Error('Employee name was not updated')
  }
  
  console.log(`   ✏️ Updated employee: ${response.data.data.nama}`)
}

async function testUpdateNonExistentEmployee(): Promise<void> {
  const nonExistentId = '00000000-0000-0000-0000-000000000000'
  const updateData = {
    id: nonExistentId,
    nama: `Non Existent Employee ${timestamp}`
  }
  
  const response = await makeRequest('PUT', '/employees', updateData)
  
  if (response.status !== 404) {
    throw new Error(`Expected status 404, got ${response.status}`)
  }
  
  if (response.data.success !== false) {
    throw new Error('Expected update to fail for non-existent employee')
  }
}

async function testSoftDeleteEmployee(): Promise<void> {
  // Create employee specifically for soft delete test
  const softDelTimestamp = Date.now() + Math.random() * 1000;
  const testData = {
    ...validEmployeeData,
    nama: `Test Employee Soft Delete ${softDelTimestamp}`,
    nik: `SOFTDEL${Math.floor(softDelTimestamp)}`.slice(0, 16),
    noRekening: `${Math.floor(softDelTimestamp)}`.slice(-10)
  }
  
  const createResponse = await makeRequest('POST', '/employees', testData)
  if (!createResponse.data.success) {
    console.error('❌ Create response for soft delete test:', JSON.stringify(createResponse, null, 2))
    throw new Error(`Failed to create employee for soft delete test: ${createResponse.data.error || 'Unknown error'}`)
  }
  
  const employeeId = createResponse.data.data.id
  createdEmployeeIds.push(employeeId)
  
  // Soft delete
  const deleteResponse = await makeRequest('DELETE', `/employees?id=${employeeId}`)
  
  if (deleteResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${deleteResponse.status}`)
  }
  
  if (!deleteResponse.data.success) {
    throw new Error('Expected soft delete to succeed')
  }
  
  console.log(`   🗑️ Soft deleted employee: ${employeeId}`)
}

async function testHardDeleteTestingEmployee(): Promise<void> {
  // Create employee with 'test' in name for hard delete
  const hardDelTimestamp = Date.now() + Math.random() * 2000;
  const testData = {
    ...validEmployeeData,
    nama: `Test Employee Hard Delete ${hardDelTimestamp}`,
    nik: `HARDDEL${Math.floor(hardDelTimestamp)}`.slice(0, 16),
    noRekening: `${Math.floor(hardDelTimestamp)}`.slice(-10)
  }
  
  const createResponse = await makeRequest('POST', '/employees', testData)
  if (!createResponse.data.success) {
    console.error('❌ Create response for hard delete test:', JSON.stringify(createResponse, null, 2))
    throw new Error(`Failed to create employee for hard delete test: ${createResponse.data.error || 'Unknown error'}`)
  }
  
  const employeeId = createResponse.data.data.id
  
  // Hard delete
  const deleteResponse = await makeRequest('DELETE', `/employees?id=${employeeId}&hardDelete=true&testingMode=true`)
  
  if (deleteResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${deleteResponse.status}`)
  }
  
  if (!deleteResponse.data.success) {
    throw new Error('Expected hard delete to succeed')
  }
  
  console.log(`   🗑️ Hard deleted test employee: ${employeeId}`)
}

async function testHardDeleteProductionEmployee(): Promise<void> {
  // Create production employee (no 'test' in name)
  const prodTimestamp = Date.now() + Math.random() * 3000;
  const prodData = {
    ...validEmployeeData,
    nama: `Production Employee ${prodTimestamp}`,
    nik: `PROD${Math.floor(prodTimestamp)}`.slice(0, 16),
    noRekening: `${Math.floor(prodTimestamp)}`.slice(-10)
  }
  
  const createResponse = await makeRequest('POST', '/employees', prodData)
  if (!createResponse.data.success) {
    throw new Error('Failed to create production employee')
  }
  
  const employeeId = createResponse.data.data.id
  createdEmployeeIds.push(employeeId)
  
  // Try hard delete (should fail)
  const deleteResponse = await makeRequest('DELETE', `/employees?id=${employeeId}&hardDelete=true&testingMode=true`)
  
  if (deleteResponse.status !== 403) {
    throw new Error(`Expected status 403, got ${deleteResponse.status}`)
  }
  
  if (deleteResponse.data.success !== false) {
    throw new Error('Expected hard delete to fail for production employee')
  }
  
  console.log(`   🛡️ Production employee protected from hard delete`)
}

async function testDeleteInvalidId(): Promise<void> {
  const response = await makeRequest('DELETE', '/employees?id=invalid-id')
  
  if (response.status !== 400) {
    throw new Error(`Expected status 400, got ${response.status}`)
  }
  
  if (response.data.success !== false) {
    throw new Error('Expected delete with invalid ID to fail')
  }
}

// Cleanup function
async function cleanup(): Promise<void> {
  console.log('\n🧹 Cleaning up test data...')
  
  for (const employeeId of createdEmployeeIds) {
    try {
      await makeRequest('DELETE', `/employees?id=${employeeId}&hardDelete=true&testingMode=true`)
      console.log(`   ✅ Cleaned up employee: ${employeeId}`)
    } catch (error) {
      console.log(`   ⚠️ Failed to cleanup employee ${employeeId}: ${error}`)
    }
  }
}

// Main test runner
async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Employee CRUD End-to-End Testing')
  console.log('=' .repeat(60))
  
  console.log('\n📋 CREATE Operations')
  await runTest('Create employee with valid data', testCreateValidEmployee)
  await runTest('Reject invalid employee data', testCreateInvalidEmployee)
  await runTest('Prevent duplicate NIK', testCreateDuplicateNIK)
  
  console.log('\n📋 READ Operations')
  await runTest('Get all employees', testGetAllEmployees)
  await runTest('Search employees', testSearchEmployee)
  
  console.log('\n📋 UPDATE Operations')
  await runTest('Update employee with valid data', testUpdateEmployee)
  await runTest('Reject update for non-existent employee', testUpdateNonExistentEmployee)
  
  console.log('\n📋 DELETE Operations')
  await runTest('Soft delete employee', testSoftDeleteEmployee)
  await runTest('Hard delete testing employee', testHardDeleteTestingEmployee)
  await runTest('Protect production employee from hard delete', testHardDeleteProductionEmployee)
  await runTest('Reject delete with invalid ID', testDeleteInvalidId)
  
  // Cleanup
  await cleanup()
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = testResults.filter(r => r.status === 'PASS').length
  const failed = testResults.filter(r => r.status === 'FAIL').length
  const skipped = testResults.filter(r => r.status === 'SKIP').length
  const total = testResults.length
  
  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${failed}/${total}`)
  console.log(`⏭️ Skipped: ${skipped}/${total}`)
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    testResults
      .filter(r => r.status === 'FAIL')
      .forEach(r => console.log(`   - ${r.name}: ${r.message}`))
  }
  
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0)
  console.log(`\n⏱️ Total Duration: ${totalDuration}ms`)
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Employee CRUD operations are working correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.')
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n💥 Test runner failed:', error)
    process.exit(1)
  })
}

export { runAllTests, testResults }