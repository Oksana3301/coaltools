# 🧪 Testing Guide - CoalTools

## 📋 Overview

Panduan ini mencakup semua aspek testing untuk aplikasi CoalTools, mulai dari unit testing hingga end-to-end testing.

## 🏗️ Test Structure

```
tests/
├── unit/                 # Unit tests
│   ├── components/       # React component tests
│   ├── utils/           # Utility function tests
│   └── api/             # API logic tests
├── integration/         # Integration tests
│   ├── api/             # API endpoint tests
│   └── database/        # Database tests
├── e2e/                 # End-to-end tests
│   ├── auth/            # Authentication flows
│   ├── employee/        # Employee management
│   └── payroll/         # Payroll processes
└── fixtures/            # Test data
    ├── employees.json
    ├── payroll.json
    └── users.json
```

## 🔧 Setup Testing Environment

### Install Dependencies
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event msw
npm install --save-dev playwright @playwright/test
```

### Configuration Files

**jest.config.js**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './'
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1'
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}

module.exports = createJestConfig(customJestConfig)
```

**jest.setup.js**
```javascript
import '@testing-library/jest-dom'
import { server } from './tests/mocks/server'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/'
}))

// Setup MSW
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## 🧪 Unit Testing

### Component Testing

**tests/unit/components/EmployeeForm.test.tsx**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmployeeForm } from '@/components/employees/EmployeeForm'

describe('EmployeeForm', () => {
  const mockOnSubmit = jest.fn()
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false
  }

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders all required fields', () => {
    render(<EmployeeForm {...defaultProps} />)
    
    expect(screen.getByLabelText(/nama/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nik/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/jabatan/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/site/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<EmployeeForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /simpan/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/nama wajib diisi/i)).toBeInTheDocument()
      expect(screen.getByText(/nik wajib diisi/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<EmployeeForm {...defaultProps} />)
    
    await user.type(screen.getByLabelText(/nama/i), 'John Doe')
    await user.type(screen.getByLabelText(/nik/i), 'EMP001')
    await user.selectOptions(screen.getByLabelText(/jabatan/i), 'Operator')
    await user.selectOptions(screen.getByLabelText(/site/i), 'Site A')
    
    await user.click(screen.getByRole('button', { name: /simpan/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        nama: 'John Doe',
        nik: 'EMP001',
        jabatan: 'Operator',
        site: 'Site A'
      })
    })
  })

  it('shows loading state', () => {
    render(<EmployeeForm {...defaultProps} isLoading={true} />)
    
    expect(screen.getByRole('button', { name: /menyimpan/i })).toBeDisabled()
  })
})
```

### Utility Function Testing

**tests/unit/utils/payroll.test.ts**
```typescript
import { calculatePayroll, formatCurrency } from '@/lib/payroll-utils'

describe('Payroll Utils', () => {
  describe('calculatePayroll', () => {
    it('calculates basic salary correctly', () => {
      const employee = {
        kontrakUpahHarian: 150000,
        defaultUangMakan: 25000,
        defaultUangBbm: 15000
      }
      
      const workData = {
        hariKerja: 22,
        jamLembur: 0,
        bonus: 0,
        potongan: 0
      }
      
      const result = calculatePayroll(employee, workData)
      
      expect(result.gajiPokok).toBe(3300000) // 150000 * 22
      expect(result.uangMakan).toBe(550000)  // 25000 * 22
      expect(result.uangBbm).toBe(330000)    // 15000 * 22
      expect(result.totalGaji).toBe(4180000)
    })

    it('calculates overtime correctly', () => {
      const employee = {
        kontrakUpahHarian: 150000,
        defaultUangMakan: 25000,
        defaultUangBbm: 15000
      }
      
      const workData = {
        hariKerja: 22,
        jamLembur: 10,
        bonus: 0,
        potongan: 0
      }
      
      const result = calculatePayroll(employee, workData)
      
      // Overtime = (150000 / 8) * 1.5 * 10 = 281250
      expect(result.uangLembur).toBe(281250)
      expect(result.totalGaji).toBe(4461250)
    })
  })

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1000000)).toBe('Rp 1.000.000')
      expect(formatCurrency(500)).toBe('Rp 500')
      expect(formatCurrency(0)).toBe('Rp 0')
    })
  })
})
```

## 🔗 Integration Testing

### API Endpoint Testing

**tests/integration/api/employees.test.ts**
```typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/employees/route'
import { PrismaClient } from '@prisma/client'

// Mock Prisma
jest.mock('@prisma/client')
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>

describe('/api/employees', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns employees list', async () => {
      const mockEmployees = [
        {
          id: '1',
          nama: 'John Doe',
          nik: 'EMP001',
          jabatan: 'Operator',
          site: 'Site A',
          aktif: true
        }
      ]

      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees)
      mockPrisma.employee.count.mockResolvedValue(1)

      const { req, res } = createMocks({ method: 'GET' })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockEmployees)
    })

    it('handles database errors', async () => {
      mockPrisma.employee.findMany.mockRejectedValue(new Error('DB Error'))

      const { req, res } = createMocks({ method: 'GET' })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
    })
  })

  describe('POST', () => {
    it('creates new employee', async () => {
      const newEmployee = {
        nama: 'Jane Doe',
        nik: 'EMP002',
        jabatan: 'Operator',
        site: 'Site A'
      }

      const createdEmployee = { id: '2', ...newEmployee, aktif: true }
      mockPrisma.employee.create.mockResolvedValue(createdEmployee)

      const { req, res } = createMocks({
        method: 'POST',
        body: newEmployee
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdEmployee)
    })

    it('validates required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { nama: 'Jane Doe' } // Missing required fields
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('validation')
    })
  })
})
```

### Database Testing

**tests/integration/database/employee.test.ts**
```typescript
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
})

describe('Employee Database Operations', () => {
  beforeAll(async () => {
    // Reset test database
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up data before each test
    await prisma.employee.deleteMany()
  })

  it('creates employee with valid data', async () => {
    const employeeData = {
      id: 'test-emp-1',
      nama: 'John Doe',
      nik: 'EMP001',
      jabatan: 'Operator',
      site: 'Site A',
      kontrakUpahHarian: 150000,
      defaultUangMakan: 25000,
      defaultUangBbm: 15000
    }

    const employee = await prisma.employee.create({
      data: employeeData
    })

    expect(employee.id).toBe(employeeData.id)
    expect(employee.nama).toBe(employeeData.nama)
    expect(employee.aktif).toBe(true) // Default value
  })

  it('enforces unique NIK constraint', async () => {
    const employeeData = {
      id: 'test-emp-1',
      nama: 'John Doe',
      nik: 'EMP001',
      jabatan: 'Operator',
      site: 'Site A'
    }

    await prisma.employee.create({ data: employeeData })

    await expect(
      prisma.employee.create({
        data: { ...employeeData, id: 'test-emp-2', nama: 'Jane Doe' }
      })
    ).rejects.toThrow()
  })

  it('soft deletes employee', async () => {
    const employee = await prisma.employee.create({
      data: {
        id: 'test-emp-1',
        nama: 'John Doe',
        nik: 'EMP001',
        jabatan: 'Operator',
        site: 'Site A'
      }
    })

    await prisma.employee.update({
      where: { id: employee.id },
      data: { aktif: false }
    })

    const updatedEmployee = await prisma.employee.findUnique({
      where: { id: employee.id }
    })

    expect(updatedEmployee?.aktif).toBe(false)
  })
})
```

## 🎭 End-to-End Testing

### Playwright Configuration

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

### Authentication E2E Tests

**tests/e2e/auth/login.spec.ts**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/auth')
    
    await page.fill('[data-testid="email-input"]', 'admin@example.com')
    await page.fill('[data-testid="password-input"]', 'Admin123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/auth')
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })

  test('logout works correctly', async ({ page }) => {
    // Login first
    await page.goto('/auth')
    await page.fill('[data-testid="email-input"]', 'admin@example.com')
    await page.fill('[data-testid="password-input"]', 'Admin123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    await expect(page).toHaveURL('/auth')
  })
})
```

### Employee Management E2E Tests

**tests/e2e/employee/crud.spec.ts**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.fill('[data-testid="email-input"]', 'admin@example.com')
    await page.fill('[data-testid="password-input"]', 'Admin123!')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('create new employee', async ({ page }) => {
    await page.goto('/coal-tools-karyawan')
    
    await page.click('[data-testid="add-employee-button"]')
    
    await page.fill('[data-testid="nama-input"]', 'John Doe Test')
    await page.fill('[data-testid="nik-input"]', 'TEST001')
    await page.selectOption('[data-testid="jabatan-select"]', 'Operator')
    await page.selectOption('[data-testid="site-select"]', 'Site A')
    await page.fill('[data-testid="upah-input"]', '150000')
    
    await page.click('[data-testid="save-button"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('table')).toContainText('John Doe Test')
  })

  test('edit existing employee', async ({ page }) => {
    await page.goto('/coal-tools-karyawan')
    
    // Assuming there's at least one employee
    await page.click('[data-testid="edit-button"]').first()
    
    await page.fill('[data-testid="nama-input"]', 'Updated Name')
    await page.click('[data-testid="save-button"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('table')).toContainText('Updated Name')
  })

  test('delete employee', async ({ page }) => {
    await page.goto('/coal-tools-karyawan')
    
    await page.click('[data-testid="delete-button"]').first()
    await page.click('[data-testid="confirm-delete"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('search employees', async ({ page }) => {
    await page.goto('/coal-tools-karyawan')
    
    await page.fill('[data-testid="search-input"]', 'John')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Wait for search results
    await page.waitForTimeout(1000)
    
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(1) // Assuming only one John
  })
})
```

## 🏃‍♂️ Running Tests

### Unit and Integration Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- EmployeeForm.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="validation"
```

### E2E Tests
```bash
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npx playwright test

# Run tests in headed mode
npx playwright test --headed

# Run specific test file
npx playwright test auth/login.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## 📊 Test Coverage

### Coverage Reports
```bash
# Generate coverage report
npm test -- --coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Coverage Targets
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

## 🔄 Continuous Integration

### GitHub Actions Workflow

**.github/workflows/test.yml**
```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: coaltools_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test database
      run: |
        npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/coaltools_test
    
    - name: Run unit tests
      run: npm test -- --coverage
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/coaltools_test
    
    - name: Run E2E tests
      run: npx playwright test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/coaltools_test
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## 📝 Test Data Management

### Fixtures

**tests/fixtures/employees.json**
```json
[
  {
    "id": "test-emp-1",
    "nama": "John Doe",
    "nik": "EMP001",
    "jabatan": "Operator",
    "site": "Site A",
    "kontrakUpahHarian": 150000,
    "defaultUangMakan": 25000,
    "defaultUangBbm": 15000,
    "aktif": true
  },
  {
    "id": "test-emp-2",
    "nama": "Jane Smith",
    "nik": "EMP002",
    "jabatan": "Supervisor",
    "site": "Site B",
    "kontrakUpahHarian": 200000,
    "defaultUangMakan": 30000,
    "defaultUangBbm": 20000,
    "aktif": true
  }
]
```

### Test Utilities

**tests/utils/test-helpers.ts**
```typescript
import { PrismaClient } from '@prisma/client'
import employeeFixtures from '../fixtures/employees.json'

const prisma = new PrismaClient()

export async function seedTestData() {
  // Clean existing data
  await prisma.employee.deleteMany()
  await prisma.user.deleteMany()
  
  // Seed test users
  await prisma.user.create({
    data: {
      id: 'test-admin',
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'hashedpassword',
      role: 'ADMIN'
    }
  })
  
  // Seed test employees
  for (const employee of employeeFixtures) {
    await prisma.employee.create({ data: employee })
  }
}

export async function cleanTestData() {
  await prisma.employee.deleteMany()
  await prisma.user.deleteMany()
}

export function createMockEmployee(overrides = {}) {
  return {
    id: 'mock-emp-' + Math.random().toString(36).substr(2, 9),
    nama: 'Mock Employee',
    nik: 'MOCK' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    jabatan: 'Operator',
    site: 'Site A',
    kontrakUpahHarian: 150000,
    defaultUangMakan: 25000,
    defaultUangBbm: 15000,
    aktif: true,
    ...overrides
  }
}
```

## 🐛 Debugging Tests

### Debug Jest Tests
```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand EmployeeForm.test.tsx

# Debug with VS Code
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug Playwright Tests
```bash
# Debug mode with browser
npx playwright test --debug

# Debug specific test
npx playwright test auth/login.spec.ts --debug

# Record new test
npx playwright codegen localhost:3000
```

## 📋 Testing Checklist

### Before Release
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Code coverage meets threshold (80%)
- [ ] No console errors in tests
- [ ] Performance tests pass
- [ ] Security tests pass
- [ ] Cross-browser compatibility verified

### Test Categories
- [ ] **Authentication**: Login, logout, session management
- [ ] **Employee Management**: CRUD operations, validation
- [ ] **Payroll**: Calculations, reports, exports
- [ ] **Financial**: Kas besar, kas kecil transactions
- [ ] **Reports**: Generation, exports, data accuracy
- [ ] **UI/UX**: Responsive design, accessibility
- [ ] **API**: All endpoints, error handling
- [ ] **Database**: Data integrity, constraints

---

*Testing adalah bagian integral dari development process. Pastikan semua tests dijalankan sebelum deployment ke production.*