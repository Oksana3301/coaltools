# Comprehensive Test Scenarios - Payroll Calculator

## Overview
Dokumen ini berisi skenario testing komprehensif untuk sistem kalkulator gaji yang telah direfactor menjadi komponen modular.

## Test Categories

### 1. Unit Tests - Individual Components

#### 1.1 PayrollSteps Component
**Test Cases:**
- ✅ Render semua langkah dengan benar
- ✅ Navigasi antar langkah berfungsi
- ✅ Validasi step yang aktif
- ✅ Disable/enable tombol navigasi sesuai kondisi
- ✅ Progress indicator menampilkan persentase yang benar

**Test Data:**
```javascript
const mockSteps = [
  { id: 'employees', label: 'Pilih Karyawan', completed: false },
  { id: 'calculation', label: 'Perhitungan', completed: false },
  { id: 'summary', label: 'Ringkasan', completed: false }
]
```

#### 1.2 EmployeeSelector Component
**Test Cases:**
- ✅ Menampilkan daftar karyawan dengan benar
- ✅ Pencarian karyawan berdasarkan nama/NIK
- ✅ Filter berdasarkan site dan jabatan
- ✅ Bulk selection (select all/none)
- ✅ Indeterminate checkbox state
- ✅ Maksimal selection limit
- ✅ Toggle karyawan aktif/non-aktif

**Test Data:**
```javascript
const mockEmployees = [
  {
    id: 'emp-1',
    nama: 'John Doe',
    nik: 'EMP001',
    jabatan: 'Operator',
    site: 'Site A',
    kontrakUpahHarian: 150000,
    aktif: true
  },
  {
    id: 'emp-2', 
    nama: 'Jane Smith',
    nik: 'EMP002',
    jabatan: 'Supervisor',
    site: 'Site B',
    kontrakUpahHarian: 200000,
    aktif: false
  }
]
```

#### 1.3 PayrollCalculationForm Component
**Test Cases:**
- ✅ Input hari kerja untuk setiap karyawan
- ✅ Perhitungan overtime (normal, holiday, night)
- ✅ Pemilihan komponen gaji (earnings/deductions)
- ✅ Custom hourly rate override
- ✅ Cashbon deduction input
- ✅ Real-time calculation update
- ✅ Validasi input (min/max values)
- ✅ Global settings application

**Test Data:**
```javascript
const mockPayComponents = [
  {
    id: 'comp-1',
    nama: 'Tunjangan Lapangan',
    tipe: 'EARNING',
    metode: 'PER_HARI',
    basis: 'HARI_KERJA',
    rate: 25000,
    aktif: true
  },
  {
    id: 'comp-2',
    nama: 'Potongan Kasbon',
    tipe: 'DEDUCTION',
    metode: 'FLAT',
    nominal: 300000,
    aktif: true
  }
]
```

#### 1.4 PayrollSummary Component
**Test Cases:**
- ✅ Menampilkan statistik payroll dengan benar
- ✅ Breakdown komponen earnings dan deductions
- ✅ Tabel detail hasil perhitungan
- ✅ Format currency Indonesia (IDR)
- ✅ Sorting dan filtering hasil
- ✅ Export functionality

### 2. Integration Tests - Component Interactions

#### 2.1 Employee Selection to Calculation Flow
**Scenario:** User memilih karyawan dan melanjutkan ke perhitungan
- ✅ Data karyawan terpilih diteruskan dengan benar
- ✅ Form calculation menampilkan karyawan yang dipilih
- ✅ Default values diisi sesuai data karyawan

#### 2.2 Calculation to Summary Flow
**Scenario:** User menyelesaikan perhitungan dan melihat ringkasan
- ✅ Hasil perhitungan diteruskan dengan benar
- ✅ Summary menampilkan data yang akurat
- ✅ Statistik dihitung dengan benar

#### 2.3 State Management Integration
**Scenario:** Testing usePayrollState hook
- ✅ State persistence antar komponen
- ✅ Loading states management
- ✅ Error handling
- ✅ Data validation

### 3. Business Logic Tests - usePayrollCalculations Hook

#### 3.1 Salary Calculation Logic
**Test Cases:**
- ✅ Upah pokok = upah harian × hari kerja
- ✅ Overtime calculation dengan rate berbeda
- ✅ Component calculation berdasarkan metode (FLAT, PER_HARI, PERSENTASE)
- ✅ Tax calculation (5% default)
- ✅ Net pay = gross - deductions - tax

**Test Scenarios:**
```javascript
// Scenario 1: Basic calculation
const employee = {
  kontrakUpahHarian: 150000,
  hariKerja: 26
}
// Expected: upahPokok = 150000 × 26 = 3,900,000

// Scenario 2: Overtime calculation
const overtime = {
  normalHours: 10,
  rate: 1.5
}
// Expected: overtimeAmount = (150000/8) × 10 × 1.5 = 281,250

// Scenario 3: Component calculation
const component = {
  metode: 'PERSENTASE',
  rate: 10,
  basis: 'BRUTO'
}
// Expected: componentAmount = 3,900,000 × 0.1 = 390,000
```

#### 3.2 Edge Cases Testing
**Test Cases:**
- ✅ Zero working days
- ✅ Maximum working days (31)
- ✅ Negative overtime hours (should be 0)
- ✅ Component with capMin/capMax
- ✅ Inactive components (should be excluded)
- ✅ Missing employee data
- ✅ Invalid component configuration

### 4. Performance Tests

#### 4.1 Large Dataset Handling
**Test Cases:**
- ✅ 1000+ employees selection performance
- ✅ Complex calculation with multiple components
- ✅ Real-time calculation updates
- ✅ Memory usage optimization

#### 4.2 Rendering Performance
**Test Cases:**
- ✅ Virtual scrolling untuk daftar karyawan besar
- ✅ Debounced search input
- ✅ Memoized calculations
- ✅ Lazy loading komponen

### 5. User Experience Tests

#### 5.1 Responsive Design
**Test Cases:**
- ✅ Mobile view (320px - 768px)
- ✅ Tablet view (768px - 1024px)
- ✅ Desktop view (1024px+)
- ✅ Touch interactions pada mobile

#### 5.2 Accessibility
**Test Cases:**
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ ARIA labels dan roles
- ✅ Focus management
- ✅ Color contrast compliance

#### 5.3 Error Handling
**Test Cases:**
- ✅ Network error handling
- ✅ Validation error display
- ✅ Loading states
- ✅ Empty states
- ✅ Error recovery mechanisms

### 6. API Integration Tests

#### 6.1 Employee Data API
**Test Cases:**
- ✅ Fetch employees list
- ✅ Search employees
- ✅ Filter employees by criteria
- ✅ Handle API errors gracefully

#### 6.2 Pay Components API
**Test Cases:**
- ✅ Fetch active pay components
- ✅ Component CRUD operations
- ✅ Validation rules enforcement

#### 6.3 Payroll Processing API
**Test Cases:**
- ✅ Save payroll calculations
- ✅ Generate payroll reports
- ✅ Export payroll data
- ✅ Audit trail logging

### 7. Security Tests

#### 7.1 Data Validation
**Test Cases:**
- ✅ Input sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF token validation

#### 7.2 Authorization
**Test Cases:**
- ✅ Role-based access control
- ✅ Employee data privacy
- ✅ Payroll data encryption
- ✅ Audit logging

## Test Execution Plan

### Phase 1: Unit Tests (Week 1)
- Setup testing framework (Jest + React Testing Library)
- Implement component unit tests
- Achieve 90%+ code coverage

### Phase 2: Integration Tests (Week 2)
- Component interaction testing
- State management testing
- API integration testing

### Phase 3: E2E Tests (Week 3)
- User journey testing dengan Playwright
- Cross-browser compatibility
- Performance benchmarking

### Phase 4: Security & Accessibility (Week 4)
- Security vulnerability scanning
- Accessibility compliance testing
- Load testing dengan realistic data

## Success Criteria

### Code Quality
- ✅ 90%+ unit test coverage
- ✅ 80%+ integration test coverage
- ✅ Zero critical security vulnerabilities
- ✅ WCAG 2.1 AA compliance

### Performance
- ✅ < 3s initial page load
- ✅ < 500ms calculation response time
- ✅ < 100ms UI interaction response
- ✅ Supports 1000+ employees without performance degradation

### Reliability
- ✅ 99.9% uptime
- ✅ Graceful error handling
- ✅ Data consistency validation
- ✅ Automatic error recovery

## Test Data Management

### Mock Data Sets
1. **Small Dataset**: 10 employees, 5 components
2. **Medium Dataset**: 100 employees, 15 components
3. **Large Dataset**: 1000+ employees, 25+ components
4. **Edge Cases**: Invalid data, boundary conditions

### Test Environment Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @playwright/test
npm install --save-dev jest-environment-jsdom

# Run tests
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
```

## Reporting

### Test Reports
- Unit test coverage report
- Integration test results
- Performance benchmarks
- Security scan results
- Accessibility audit report

### Continuous Integration
- Automated testing pada setiap PR
- Performance regression detection
- Security vulnerability scanning
- Code quality gates

---

**Status:** ✅ Test scenarios documented
**Next Steps:** Implement test cases dan setup CI/CD pipeline
**Owner:** Development Team
**Last Updated:** 2025-01-17